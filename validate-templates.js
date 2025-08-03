/**
 * Standalone Template Validation Script
 * Run this with: node validate-templates.js
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

class TemplateValidator {
  
  /**
   * Extract all placeholders from a template document
   */
  static async extractPlaceholders(templatePath, templateName) {
    try {
      const templateBuffer = fs.readFileSync(templatePath);
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(templateBuffer);
      
      const documentXml = zipContent.file('word/document.xml');
      if (!documentXml) {
        throw new Error('document.xml not found in template');
      }
      
      const xmlContent = await documentXml.async('text');
      const issues = [];
      
      // Extract all potential placeholders (including broken ones)
      const placeholders = [];
      const brokenPlaceholders = [];
      
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
        !text.includes('HTTP') &&
        !text.includes('SCHEMA')
      );
      
      if (potentialPlaceholders.length > 0) {
        issues.push(`Potential missing placeholders: ${[...new Set(potentialPlaceholders)].slice(0, 10).join(', ')}`);
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
   * Validate all templates in the templates folder
   */
  static async validateAllTemplates() {
    const templatesDir = path.join(__dirname, 'public', 'templates');
    
    if (!fs.existsSync(templatesDir)) {
      console.error('Templates directory not found:', templatesDir);
      return;
    }
    
    const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.docx'));
    
    console.log(`Found ${templateFiles.length} template files in ${templatesDir}`);
    console.log('Template files:', templateFiles);
    
    const results = [];
    let totalPlaceholders = 0;
    let totalBrokenPlaceholders = 0;
    let templatesWithIssues = 0;
    
    for (const templateFile of templateFiles) {
      const templatePath = path.join(templatesDir, templateFile);
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Analyzing template: ${templateFile}`);
      console.log(`${'='.repeat(60)}`);
      
      try {
        const analysis = await this.extractPlaceholders(templatePath, templateFile);
        results.push(analysis);
        
        totalPlaceholders += analysis.placeholders.length;
        totalBrokenPlaceholders += analysis.brokenPlaceholders.length;
        
        if (analysis.issues.length > 0 || analysis.brokenPlaceholders.length > 0) {
          templatesWithIssues++;
        }
        
        // Log results for this template
        console.log(`✅ Valid placeholders (${analysis.placeholders.length}):`);
        if (analysis.placeholders.length > 0) {
          analysis.placeholders.forEach(p => console.log(`   - {{${p}}}`));
        } else {
          console.log('   (none found)');
        }
        
        if (analysis.brokenPlaceholders.length > 0) {
          console.log(`⚠️  Broken placeholders (${analysis.brokenPlaceholders.length}):`);
          analysis.brokenPlaceholders.forEach(p => console.log(`   - ${p}`));
        }
        
        if (analysis.issues.length > 0) {
          console.log('🔍 Issues found:');
          analysis.issues.forEach(issue => console.log(`   - ${issue}`));
        }
        
        if (analysis.placeholders.length === 0 && analysis.brokenPlaceholders.length === 0 && analysis.issues.length === 0) {
          console.log('✅ No placeholders or issues found (static template)');
        }
        
      } catch (error) {
        console.error(`❌ Error processing template ${templateFile}:`, error);
        results.push({
          templateName: templateFile,
          error: error.message,
          placeholders: [],
          brokenPlaceholders: [],
          issues: [error.message]
        });
        templatesWithIssues++;
      }
    }
    
    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('VALIDATION SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total templates analyzed: ${templateFiles.length}`);
    console.log(`Templates with issues: ${templatesWithIssues}`);
    console.log(`Total valid placeholders: ${totalPlaceholders}`);
    console.log(`Total broken placeholders: ${totalBrokenPlaceholders}`);
    
    // Collect all unique placeholders
    const allPlaceholders = new Set();
    results.forEach(template => {
      template.placeholders?.forEach(p => allPlaceholders.add(p));
    });
    
    console.log(`\nAll unique placeholders found (${allPlaceholders.size}):`);
    Array.from(allPlaceholders).sort().forEach(placeholder => {
      console.log(`- {{${placeholder}}}`);
    });
    
    // Generate report file
    const report = this.generateReport(results, {
      totalTemplates: templateFiles.length,
      templatesWithIssues,
      totalPlaceholders,
      totalBrokenPlaceholders,
      allPlaceholders: Array.from(allPlaceholders)
    });
    
    const reportPath = path.join(__dirname, 'template-validation-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    return results;
  }
  
  /**
   * Generate markdown report
   */
  static generateReport(results, summary) {
    let report = '# Template Validation Report\n\n';
    report += `Generated on: ${new Date().toISOString()}\n\n`;
    
    report += `## Summary\n\n`;
    report += `- **Total templates analyzed:** ${summary.totalTemplates}\n`;
    report += `- **Templates with issues:** ${summary.templatesWithIssues}\n`;
    report += `- **Total valid placeholders:** ${summary.totalPlaceholders}\n`;
    report += `- **Total broken placeholders:** ${summary.totalBrokenPlaceholders}\n\n`;
    
    report += `## All Unique Placeholders Found (${summary.allPlaceholders.length})\n\n`;
    summary.allPlaceholders.sort().forEach(placeholder => {
      report += `- \`{{${placeholder}}}\`\n`;
    });
    report += '\n';
    
    // Detail each template
    results.forEach(template => {
      report += `## ${template.templateName}\n\n`;
      
      if (template.error) {
        report += `❌ **Error:** ${template.error}\n\n`;
        return;
      }
      
      if (template.placeholders.length > 0) {
        report += `### ✅ Valid Placeholders (${template.placeholders.length})\n\n`;
        template.placeholders.forEach(p => {
          report += `- \`{{${p}}}\`\n`;
        });
        report += '\n';
      }
      
      if (template.brokenPlaceholders.length > 0) {
        report += `### ⚠️ Broken Placeholders (${template.brokenPlaceholders.length})\n\n`;
        template.brokenPlaceholders.forEach(p => {
          report += `- \`${p}\`\n`;
        });
        report += '\n';
      }
      
      if (template.issues.length > 0) {
        report += `### 🔍 Issues\n\n`;
        template.issues.forEach(issue => {
          report += `- ${issue}\n`;
        });
        report += '\n';
      }
      
      report += '---\n\n';
    });
    
    return report;
  }
}

// Run the validation
console.log('Starting template validation...\n');
TemplateValidator.validateAllTemplates()
  .then(() => {
    console.log('\n✅ Template validation completed!');
  })
  .catch(error => {
    console.error('❌ Error during validation:', error);
  });
