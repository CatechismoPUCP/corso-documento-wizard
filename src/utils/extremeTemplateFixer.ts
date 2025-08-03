import PizZip from 'pizzip';

/**
 * Extreme Template Fixer for severely corrupted Word templates
 * Handles cases where placeholders are completely broken with XML inside
 */
export class ExtremeTemplateFixer {
  
  /**
   * All known variables that should be in templates
   */
  private static readonly ALL_VARIABLES = [
    'ID_PROGETTO', 'ID_CORSO', 'ID_SEZIONE', 'NOME_CORSO', 'SEDE_CORSO',
    'DATA_INIZIO', 'DATA_FINE', 'TOTALE_ORE', 'OPERATORE', 'NOME_DOCENTE',
    'DATA_VIDIMAZIONE', 'DENOMINAZIONE_ENTE', 'SEDE_ACCREDITATA', 'PIATTAFORMA',
    'TITOLO_CORSO', 'ORE_FAD', 'REFERENTE', 'DOCENTE', 'EMAIL_REFERENTE', 
    'TELEFONO_REFERENTE', 'LINK_ZOOM', 'ID_RIUNIONE', 'PASSCODE', 'TOTALE_PAG',
    'argomenti', 'DATA_LEZIONE', 'ORARIO_INIZIO', 'ORARIO_FINE', 'MATERIA',
    // Participant placeholders
    ...Array.from({ length: 13 }, (_, i) => `PARTECIPANTE_${i + 1}`)
  ];

  /**
   * Fix extremely corrupted template by aggressive reconstruction
   */
  static async fixTemplate(templateBuffer: ArrayBuffer): Promise<ArrayBuffer> {
    try {
      console.log('🔧 ExtremeTemplateFixer: Starting aggressive template repair...');
      
      const zip = new PizZip(templateBuffer);
      const documentXml = zip.file('word/document.xml');
      
      if (!documentXml) {
        console.error('❌ No document.xml found in template');
        return templateBuffer;
      }

      let xmlContent = documentXml.asText();
      console.log('📄 Original XML length:', xmlContent.length);

      // Step 1: Fix the most common corruption pattern
      xmlContent = this.fixCorruptedPlaceholders(xmlContent);
      
      // Step 2: Reconstruct known variables aggressively
      xmlContent = this.reconstructAllVariables(xmlContent);
      
      // Step 3: Clean up any remaining XML inside placeholders
      xmlContent = this.cleanRemainingXmlInPlaceholders(xmlContent);
      
      // Step 4: Validate and log results
      const fixedPlaceholders = this.extractPlaceholders(xmlContent);
      console.log('✅ Fixed placeholders found:', fixedPlaceholders);
      
      // Update the zip with fixed content
      zip.file('word/document.xml', xmlContent);
      
      const fixedBuffer = zip.generate({ type: 'arraybuffer' });
      console.log('🎉 ExtremeTemplateFixer: Template repair completed');
      
      return fixedBuffer;
      
    } catch (error) {
      console.error('❌ ExtremeTemplateFixer failed:', error);
      return templateBuffer;
    }
  }

  /**
   * Fix the specific corruption pattern found in validation report
   */
  private static fixCorruptedPlaceholders(xmlContent: string): string {
    let fixed = xmlContent;
    
    // Pattern 1: {{</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>VARIABLE</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>}}
    this.ALL_VARIABLES.forEach(variable => {
      const corruptedPattern = new RegExp(
        `\{\{[^}]*?</w:t></w:r><w:r[^>]*?><w:rPr[^>]*?>[^<]*?</w:rPr><w:t>${variable}</w:t></w:r><w:r[^>]*?><w:rPr[^>]*?>[^<]*?</w:rPr><w:t>\}\}`,
        'g'
      );
      fixed = fixed.replace(corruptedPattern, `{{${variable}}}`);
      
      // Pattern 2: {{VARIABLE_</w:t></w:r><w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>NUMBER</w:t></w:r><w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>}}
      if (variable.startsWith('PARTECIPANTE_')) {
        const baseVar = 'PARTECIPANTE_';
        const number = variable.replace(baseVar, '');
        const participantPattern = new RegExp(
          `\{\{${baseVar}[^}]*?</w:t></w:r><w:r[^>]*?><w:rPr[^>]*?>[^<]*?</w:rPr><w:t>${number}</w:t></w:r><w:r[^>]*?><w:rPr[^>]*?>[^<]*?</w:rPr><w:t>\}\}`,
          'g'
        );
        fixed = fixed.replace(participantPattern, `{{${variable}}}`);
      }
      
      // Pattern 3: Grammar checker artifacts - {{VARIABLE</w:t></w:r><w:proofErr w:type="gramStart"/><w:r><w:t>}}
      const grammarPattern1 = new RegExp(
        `\{\{${variable}[^}]*?</w:t></w:r><w:proofErr[^>]*?/><w:r[^>]*?><w:t>\}\}`,
        'g'
      );
      fixed = fixed.replace(grammarPattern1, `{{${variable}}}`);
      
      // Pattern 4: Grammar checker with spacing - {{VARIABLE</w:t></w:r><w:proofErr w:type="gramStart"/><w:r w:rsidR="00434BC6" w:rsidRPr="00434BC6"><w:rPr><w:spacing w:val="-1"/></w:rPr><w:t>}}
      const grammarPattern2 = new RegExp(
        `\{\{${variable}[^}]*?</w:t></w:r><w:proofErr[^>]*?/><w:r[^>]*?><w:rPr[^>]*?>[^<]*?</w:rPr><w:t>\}\}`,
        'g'
      );
      fixed = fixed.replace(grammarPattern2, `{{${variable}}}`);
      
      // Pattern 5: Complex grammar end pattern - {{</w:t></w:r><w:proofErr w:type="gramEnd"/><w:r><w:rPr><w:bCs/><w:sz w:val="28"/></w:rPr><w:t>VARIABLE</w:t></w:r><w:r><w:rPr><w:bCs/><w:sz w:val="28"/><w:lang w:val="en-US"/></w:rPr><w:t>}}
      const grammarPattern3 = new RegExp(
        `\{\{[^}]*?</w:t></w:r><w:proofErr[^>]*?/><w:r[^>]*?><w:rPr[^>]*?>[^<]*?</w:rPr><w:t>${variable}</w:t></w:r><w:r[^>]*?><w:rPr[^>]*?>[^<]*?</w:rPr><w:t>\}\}`,
        'g'
      );
      fixed = fixed.replace(grammarPattern3, `{{${variable}}}`);
    });
    
    return fixed;
  }

  /**
   * Aggressively reconstruct all known variables
   */
  private static reconstructAllVariables(xmlContent: string): string {
    let fixed = xmlContent;
    
    this.ALL_VARIABLES.forEach(variable => {
      // Look for the variable name scattered across XML tags
      const variablePattern = new RegExp(
        `\\{\\{[^}]*?${variable}[^}]*?\\}\\}`,
        'gi'
      );
      
      fixed = fixed.replace(variablePattern, `{{${variable}}}`);
      
      // Also look for partial matches and reconstruct
      const parts = variable.split('_');
      if (parts.length > 1) {
        parts.forEach((part, index) => {
          if (part.length > 2) { // Only meaningful parts
            const partialPattern = new RegExp(
              `\\{\\{[^}]*?${part}[^}]*?\\}\\}`,
              'gi'
            );
            // Only replace if it looks like it should be our variable
            fixed = fixed.replace(partialPattern, (match) => {
              if (match.toLowerCase().includes(variable.toLowerCase().substring(0, 6))) {
                return `{{${variable}}}`;
              }
              return match;
            });
          }
        });
      }
    });
    
    return fixed;
  }

  /**
   * Clean any remaining XML tags inside placeholders
   */
  private static cleanRemainingXmlInPlaceholders(xmlContent: string): string {
    return xmlContent.replace(/\{\{([^}]*?)\}\}/g, (match, content) => {
      // Remove any XML tags from inside the placeholder
      const cleaned = content.replace(/<[^>]*?>/g, '').replace(/&[^;]*?;/g, '').trim();
      
      // If it's one of our known variables, use it
      const knownVar = this.ALL_VARIABLES.find(v => 
        cleaned.toUpperCase().includes(v) || v.includes(cleaned.toUpperCase())
      );
      
      if (knownVar) {
        return `{{${knownVar}}}`;
      }
      
      return `{{${cleaned}}}`;
    });
  }

  /**
   * Extract all placeholders from XML content
   */
  private static extractPlaceholders(xmlContent: string): string[] {
    const placeholders: string[] = [];
    const matches = xmlContent.match(/\{\{[^}]+\}\}/g);
    
    if (matches) {
      matches.forEach(match => {
        if (!placeholders.includes(match)) {
          placeholders.push(match);
        }
      });
    }
    
    return placeholders.sort();
  }
}
