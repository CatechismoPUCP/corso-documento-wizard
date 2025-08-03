import PizZip from 'pizzip';

/**
 * Advanced template fixer that uses a different approach
 * Instead of trying to fix broken tags, it reconstructs them from scratch
 */
export class AdvancedTemplateFixer {
  
  /**
   * Known template variables that should be in the templates
   */
  private static readonly KNOWN_VARIABLES = [
    'ID_PROGETTO', 'ID_CORSO', 'ID_SEZIONE', 'NOME_CORSO', 'SEDE_CORSO',
    'DATA_INIZIO', 'DATA_FINE', 'TOTALE_ORE', 'OPERATORE', 'NOME_DOCENTE',
    'DATA_VIDIMAZIONE', 'DENOMINAZIONE_ENTE', 'SEDE_ACCREDITATA', 'PIATTAFORMA',
    'TITOLO_CORSO', 'ORE_FAD', 'REFERENTE', 'DOCENTE', 'EMAIL_REFERENTE', 'TELEFONO_REFERENTE',
    'LINK_ZOOM', 'ID_RIUNIONE', 'PASSCODE', 'TOTALE_PAG',
    // Add participant placeholders
    ...Array.from({ length: 13 }, (_, i) => `PARTECIPANTE_${i + 1}`),
    'NOME_COMPLETO',
    'EMAIL', 'DATA_LEZIONE', 'ORARIO_INIZIO', 'ORARIO_FINE',
    'MATERIA', 'DOCENTE', 'TOTALE_PAG', 'PARTE_1', 'PARTE_2',
    'PARTE_3', 'PARTE_4', 'PARTE_5', 'PARTE_6', 'PARTE_7',
    'PARTE_8', 'PARTE_9', 'PARTE_10', 'PARTE_11', 'PARTE_12',
    'PARTE_13'
  ];
  
  /**
   * Fix template by reconstructing broken variables
   */
  static async fixTemplate(templateBuffer: ArrayBuffer): Promise<ArrayBuffer> {
    try {
      const zip = new PizZip(templateBuffer);
      
      const documentXml = zip.file('word/document.xml');
      if (!documentXml) {
        throw new Error('document.xml not found in template');
      }
      
      let xmlContent = documentXml.asText();
      console.log('Starting advanced template fixing...');
      
      // For each known variable, try to find and fix it
      this.KNOWN_VARIABLES.forEach(variable => {
        xmlContent = this.reconstructVariable(xmlContent, variable);
      });
      
      // Clean up any remaining broken template syntax
      xmlContent = this.cleanupBrokenSyntax(xmlContent);
      
      // Update the document
      zip.file('word/document.xml', xmlContent);
      
      const fixedBuffer = zip.generate({
        type: 'arraybuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      console.log('Advanced template fixing completed');
      return fixedBuffer;
      
    } catch (error) {
      console.error('Error in advanced template fixing:', error);
      return templateBuffer;
    }
  }
  
  /**
   * Reconstruct a specific variable in the XML content
   */
  private static reconstructVariable(xmlContent: string, variable: string): string {
    // Look for fragments of the variable name scattered across the XML
    const variableChars = variable.split('');
    
    // Create a pattern that matches the variable name even if it's split across XML tags
    // This is a very aggressive approach that looks for the characters in sequence
    
    // First, try to find obvious broken patterns
    const patterns = [
      // Pattern: {{VAR<tag>IABLE}}
      new RegExp(`\\{\\{${variable.substring(0, 3)}[^}]*?<[^>]*?>[^}]*?${variable.substring(3)}[^}]*?\\}\\}`, 'g'),
      
      // Pattern: {{VAR</tag><tag>IABLE}}
      new RegExp(`\\{\\{${variable.substring(0, 3)}[^}]*?<\\/[^>]*?><[^>]*?>[^}]*?${variable.substring(3)}[^}]*?\\}\\}`, 'g'),
      
      // More general pattern: look for the start and end of the variable
      new RegExp(`\\{\\{[^}]*?${variable.substring(0, 2)}[^}]*?${variable.substring(variable.length-2)}[^}]*?\\}\\}`, 'g'),
    ];
    
    patterns.forEach(pattern => {
      const matches = xmlContent.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Extract just the text content and see if it matches our variable
          const textContent = match.replace(/<[^>]*?>/g, '');
          
          // Check if this could be our variable
          if (this.couldBeVariable(textContent, variable)) {
            const fixedTag = `{{${variable}}}`;
            console.log(`Reconstructed variable: ${match} -> ${fixedTag}`);
            xmlContent = xmlContent.replace(match, fixedTag);
          }
        });
      }
    });
    
    return xmlContent;
  }
  
  /**
   * Check if a text content could be a specific variable
   */
  private static couldBeVariable(textContent: string, variable: string): boolean {
    // Remove {{ and }}
    const cleanText = textContent.replace(/[{}]/g, '');
    
    // Check if it contains most of the characters from the variable
    const variableChars = variable.split('');
    const textChars = cleanText.split('');
    
    let matchCount = 0;
    variableChars.forEach(char => {
      if (textChars.includes(char)) {
        matchCount++;
      }
    });
    
    // If at least 70% of characters match, consider it a match
    return (matchCount / variableChars.length) >= 0.7;
  }
  
  /**
   * Clean up any remaining broken template syntax
   */
  private static cleanupBrokenSyntax(xmlContent: string): string {
    let cleaned = xmlContent;
    
    // Fix duplicate braces
    cleaned = cleaned.replace(/\{\{\{+/g, '{{');
    cleaned = cleaned.replace(/\}+\}\}/g, '}}');
    
    // Remove XML tags from within any remaining template tags
    cleaned = cleaned.replace(/\{\{([^{}]*?)\}\}/g, (match, content) => {
      if (content.includes('<')) {
        const cleanContent = content.replace(/<[^>]*?>/g, '');
        return `{{${cleanContent}}}`;
      }
      return match;
    });
    
    // Fix broken tags that span across elements
    cleaned = cleaned.replace(/\{\{([^{}]*?)<\/w:t>\s*<w:t[^>]*?>([^{}]*?)\}\}/g, '{{$1$2}}');
    
    return cleaned;
  }
  
  /**
   * Validate the fixed template
   */
  static validateTemplate(xmlContent: string): { isValid: boolean; foundVariables: string[] } {
    const foundVariables = [];
    
    // Extract all template tags
    const tags = xmlContent.match(/\{\{[^{}]*?\}\}/g) || [];
    
    tags.forEach(tag => {
      const variable = tag.replace(/[{}]/g, '');
      if (this.KNOWN_VARIABLES.includes(variable)) {
        foundVariables.push(variable);
      }
    });
    
    return {
      isValid: foundVariables.length > 0,
      foundVariables
    };
  }
}
