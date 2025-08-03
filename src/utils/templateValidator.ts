import PizZip from 'pizzip';

/**
 * Template Validator - Analyzes template documents to extract actual placeholders
 * and compare them with the data we're providing
 */
export class TemplateValidator {
  
  /**
   * Extract all placeholders from a template document
   */
  static async extractPlaceholders(templateBuffer: ArrayBuffer, templateName: string): Promise<{
    templateName: string;
    placeholders: string[];
    brokenPlaceholders: string[];
    xmlContent: string;
    issues: string[];
  }> {
    try {
      const zip = new PizZip(templateBuffer);
      
      const documentXml = zip.file('word/document.xml');
      if (!documentXml) {
        throw new Error('document.xml not found in template');
      }
      
      const xmlContent = documentXml.asText();
      const issues: string[] = [];
      
      // Extract all potential placeholders (including broken ones)
      const placeholders: string[] = [];
      const brokenPlaceholders: string[] = [];
      
      // Find complete placeholders {{VARIABLE}}
      const completeMatches = xmlContent.match(/\{\{[^{}]*?\}\}/g) || [];
      completeMatches.forEach(match => {
        const variable = match.replace(/[{}]/g, '');
        if (variable.includes('<')) {
          // This is a broken placeholder with XML inside
          const cleanVariable = variable.replace(/<[^>]*?>/g, '');
          brokenPlaceholders.push(`${match} -> should be {{${cleanVariable}}}`);
        } else {
          placeholders.push(variable);
        }
      });
      
      // Find partial placeholders that might be split
      const partialOpen = xmlContent.match(/\{\{[^{}]*?(?=<|$)/g) || [];
      const partialClose = xmlContent.match(/(?:^|>)[^{}]*?\}\}/g) || [];
      
      if (partialOpen.length > 0) {
        issues.push(`Found ${partialOpen.length} partial opening placeholders: ${partialOpen.slice(0, 3).join(', ')}`);
      }
      
      if (partialClose.length > 0) {
        issues.push(`Found ${partialClose.length} partial closing placeholders: ${partialClose.slice(0, 3).join(', ')}`);
      }
      
      // Check for unmatched braces
      const openBraces = (xmlContent.match(/\{\{/g) || []).length;
      const closeBraces = (xmlContent.match(/\}\}/g) || []).length;
      
      if (openBraces !== closeBraces) {
        issues.push(`Unmatched braces: ${openBraces} opening, ${closeBraces} closing`);
      }
      
      // Look for text that might be intended as placeholders but are malformed
      const suspiciousText = xmlContent.match(/[A-Z_]{3,}/g) || [];
      const potentialPlaceholders = suspiciousText.filter(text => 
        text.length > 3 && 
        !placeholders.includes(text) && 
        !text.includes('XML') && 
        !text.includes('HTTP')
      );
      
      if (potentialPlaceholders.length > 0) {
        issues.push(`Potential missing placeholders: ${[...new Set(potentialPlaceholders)].slice(0, 5).join(', ')}`);
      }
      
      return {
        templateName,
        placeholders: [...new Set(placeholders)],
        brokenPlaceholders,
        xmlContent,
        issues
      };
      
    } catch (error) {
      console.error(`Error analyzing template ${templateName}:`, error);
      return {
        templateName,
        placeholders: [],
        brokenPlaceholders: [],
        xmlContent: '',
        issues: [`Error reading template: ${error.message}`]
      };
    }
  }
  
  /**
   * Compare template placeholders with provided data
   */
  static compareWithData(templateAnalysis: { placeholders: string[] }, providedData: Record<string, any>): {
    missing: string[];
    unused: string[];
    matches: string[];
  } {
    const templateVars = new Set<string>(templateAnalysis.placeholders);
    const dataKeys = new Set<string>(Object.keys(providedData));
    
    const missing: string[] = [];
    const unused: string[] = [];
    const matches: string[] = [];
    
    // Check what template expects but data doesn't provide
    templateVars.forEach((variable: string) => {
      if (dataKeys.has(variable)) {
        matches.push(variable);
      } else {
        missing.push(variable);
      }
    });
    
    // Check what data provides but template doesn't use
    dataKeys.forEach((key: string) => {
      if (!templateVars.has(key)) {
        unused.push(key);
      }
    });
    
    return { missing, unused, matches };
  }
  
  /**
   * Validate all templates in the templates folder
   */
  static async validateAllTemplates(): Promise<{
    templates: any[];
    summary: {
      totalTemplates: number;
      templatesWithIssues: number;
      totalPlaceholders: number;
      totalBrokenPlaceholders: number;
    };
  }> {
    const templateNames = [
      'Registro ID_{ID_CORSO}.docx',
      'modello A fad_{ID_CORSO}.docx', 
      'Verbale -{ID_CORSO} - Corso di formazione {ID-SEZIONE}.docx',
      'CONVOCAZIONE.docx',
      'Registro ID_HEAD_{ID_CORSO}.docx'
    ];
    
    const results = [];
    let totalPlaceholders = 0;
    let totalBrokenPlaceholders = 0;
    let templatesWithIssues = 0;
    
    for (const templateName of templateNames) {
      console.log(`\n=== Analyzing template: ${templateName} ===`);
      
      try {
        const response = await fetch(`/templates/${templateName}`);
        if (!response.ok) {
          console.warn(`Template ${templateName} not found`);
          results.push({
            templateName,
            error: 'Template file not found',
            placeholders: [],
            brokenPlaceholders: [],
            issues: ['Template file not found']
          });
          continue;
        }
        
        const templateBuffer = await response.arrayBuffer();
        const analysis = await this.extractPlaceholders(templateBuffer, templateName);
        
        results.push(analysis);
        
        totalPlaceholders += analysis.placeholders.length;
        totalBrokenPlaceholders += analysis.brokenPlaceholders.length;
        
        if (analysis.issues.length > 0 || analysis.brokenPlaceholders.length > 0) {
          templatesWithIssues++;
        }
        
        // Log results for this template
        console.log(`Found ${analysis.placeholders.length} valid placeholders:`, analysis.placeholders);
        if (analysis.brokenPlaceholders.length > 0) {
          console.log(`Found ${analysis.brokenPlaceholders.length} broken placeholders:`, analysis.brokenPlaceholders);
        }
        if (analysis.issues.length > 0) {
          console.log('Issues found:', analysis.issues);
        }
        
      } catch (error) {
        console.error(`Error processing template ${templateName}:`, error);
        results.push({
          templateName,
          error: error.message,
          placeholders: [],
          brokenPlaceholders: [],
          issues: [error.message]
        });
        templatesWithIssues++;
      }
    }
    
    return {
      templates: results,
      summary: {
        totalTemplates: templateNames.length,
        templatesWithIssues,
        totalPlaceholders,
        totalBrokenPlaceholders
      }
    };
  }
  
  /**
   * Generate a comprehensive report
   */
  static async generateValidationReport(): Promise<string> {
    const validation = await this.validateAllTemplates();
    
    let report = '# Template Validation Report\n\n';
    report += `**Summary:**\n`;
    report += `- Total templates analyzed: ${validation.summary.totalTemplates}\n`;
    report += `- Templates with issues: ${validation.summary.templatesWithIssues}\n`;
    report += `- Total valid placeholders: ${validation.summary.totalPlaceholders}\n`;
    report += `- Total broken placeholders: ${validation.summary.totalBrokenPlaceholders}\n\n`;
    
    // Collect all unique placeholders
    const allPlaceholders = new Set<string>();
    validation.templates.forEach(template => {
      template.placeholders?.forEach((p: string) => allPlaceholders.add(p));
    });
    
    report += `**All Unique Placeholders Found:**\n`;
    Array.from(allPlaceholders).sort().forEach(placeholder => {
      report += `- {{${placeholder}}}\n`;
    });
    report += '\n';
    
    // Detail each template
    validation.templates.forEach(template => {
      report += `## ${template.templateName}\n\n`;
      
      if (template.error) {
        report += `❌ **Error:** ${template.error}\n\n`;
        return;
      }
      
      if (template.placeholders.length > 0) {
        report += `✅ **Valid Placeholders (${template.placeholders.length}):**\n`;
        template.placeholders.forEach((p: string) => {
          report += `- {{${p}}}\n`;
        });
        report += '\n';
      }
      
      if (template.brokenPlaceholders.length > 0) {
        report += `⚠️ **Broken Placeholders (${template.brokenPlaceholders.length}):**\n`;
        template.brokenPlaceholders.forEach((p: string) => {
          report += `- ${p}\n`;
        });
        report += '\n';
      }
      
      if (template.issues.length > 0) {
        report += `🔍 **Issues:**\n`;
        template.issues.forEach((issue: string) => {
          report += `- ${issue}\n`;
        });
        report += '\n';
      }
      
      report += '---\n\n';
    });
    
    return report;
  }
}
