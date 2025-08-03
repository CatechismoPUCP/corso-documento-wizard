import PizZip from 'pizzip';

/**
 * Utility to fix corrupted docx templates where Word has split template tags
 * across multiple XML elements, causing duplicate open/close tag errors.
 */
export class TemplateFixer {
  
  /**
   * Fix template tags in document.xml content
   */
  private static fixTemplateTagsInXml(xmlContent: string): string {
    let fixed = xmlContent;
    
    console.log('Starting aggressive template tag fixing...');
    
    // Step 1: Handle the most aggressive case - completely reconstruct template tags
    // Look for any sequence that starts with {{ and ends with }} and clean everything in between
    
    // First, let's find all potential template tag regions
    const templateRegions = [];
    let startIndex = 0;
    
    while (true) {
      const openIndex = fixed.indexOf('{{', startIndex);
      if (openIndex === -1) break;
      
      const closeIndex = fixed.indexOf('}}', openIndex);
      if (closeIndex === -1) break;
      
      templateRegions.push({
        start: openIndex,
        end: closeIndex + 2,
        content: fixed.substring(openIndex, closeIndex + 2)
      });
      
      startIndex = closeIndex + 2;
    }
    
    console.log(`Found ${templateRegions.length} potential template regions`);
    
    // Process each template region
    templateRegions.reverse().forEach((region, index) => {
      const originalContent = region.content;
      
      // Extract just the text content, removing all XML tags
      let cleanContent = originalContent;
      
      // Remove all XML tags
      cleanContent = cleanContent.replace(/<[^>]*?>/g, '');
      
      // Fix multiple braces
      cleanContent = cleanContent.replace(/\{\{\{+/g, '{{');
      cleanContent = cleanContent.replace(/\}+\}\}/g, '}}');
      
      // Ensure it starts with {{ and ends with }}
      if (!cleanContent.startsWith('{{')) {
        cleanContent = '{{' + cleanContent.substring(2);
      }
      if (!cleanContent.endsWith('}}')) {
        cleanContent = cleanContent.substring(0, cleanContent.length - 2) + '}}';
      }
      
      if (originalContent !== cleanContent) {
        console.log(`Fixed template region ${index}: ${originalContent} -> ${cleanContent}`);
        fixed = fixed.substring(0, region.start) + cleanContent + fixed.substring(region.end);
      }
    });
    
    // Step 2: Handle cases where template tags are split across multiple regions
    // Look for patterns like: {{PART1 ... }} ... {{PART2}}
    // This is more complex and might need manual intervention
    
    // Step 3: Clean up any remaining XML artifacts
    // Remove any stray XML tags that might be left
    const xmlInTemplatePattern = /\{\{[^{}]*?<[^>]*?>[^{}]*?\}\}/g;
    let match;
    while ((match = xmlInTemplatePattern.exec(fixed)) !== null) {
      const cleanTag = match[0].replace(/<[^>]*?>/g, '');
      fixed = fixed.replace(match[0], cleanTag);
      console.log(`Cleaned remaining XML in template: ${match[0]} -> ${cleanTag}`);
    }
    
    // Step 4: Final validation and cleanup
    fixed = fixed.replace(/\{\{\{+/g, '{{');
    fixed = fixed.replace(/\}+\}\}/g, '}}');
    
    // Step 5: Handle broken tags that span across w:t elements more aggressively
    // Pattern: {{TEXT</w:t><w:t>MORE_TEXT}}
    fixed = fixed.replace(/\{\{([^{}]*?)<\/w:t>\s*<w:t[^>]*?>([^{}]*?)\}\}/g, '{{$1$2}}');
    
    // Pattern: {{TEXT</w:t></w:r><w:r><w:t>MORE_TEXT}}
    fixed = fixed.replace(/\{\{([^{}]*?)<\/w:t><\/w:r><w:r[^>]*?><w:t[^>]*?>([^{}]*?)\}\}/g, '{{$1$2}}');
    
    console.log('Aggressive template tag fixing completed');
    return fixed;
  }
  
  /**
   * Fix a docx template by cleaning up broken template tags
   */
  static async fixTemplate(templateBuffer: ArrayBuffer): Promise<ArrayBuffer> {
    try {
      const zip = new PizZip(templateBuffer);
      
      // Get document.xml content
      const documentXml = zip.file('word/document.xml');
      if (!documentXml) {
        throw new Error('document.xml not found in template');
      }
      
      const xmlContent = documentXml.asText();
      
      // Validate original template
      const originalValidation = this.validateTemplateTags(xmlContent);
      console.log('Original template validation:', originalValidation);
      
      // Save original template content for debugging
      console.log('Original template tags found:', this.extractTemplateTags(xmlContent));
      
      if (originalValidation.isValid) {
        console.log('Template is already valid, no fixing needed');
        return templateBuffer;
      }
      
      // Fix the template tags
      const fixedXmlContent = this.fixTemplateTagsInXml(xmlContent);
      
      // Validate fixed template
      const fixedValidation = this.validateTemplateTags(fixedXmlContent);
      console.log('Fixed template validation:', fixedValidation);
      console.log('Fixed template tags found:', this.extractTemplateTags(fixedXmlContent));
      
      if (!fixedValidation.isValid) {
        console.warn('Template still has issues after fixing:', fixedValidation.errors);
        // Continue anyway, as partial fixes might still work
      }
      
      // Update the document.xml in the zip
      zip.file('word/document.xml', fixedXmlContent);
      
      // Generate the fixed template
      const fixedBuffer = zip.generate({
        type: 'arraybuffer',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });
      
      console.log('Template fixing completed successfully');
      return fixedBuffer;
      
    } catch (error) {
      console.error('Error fixing template:', error);
      // Return original template if fixing fails
      console.log('Returning original template due to fixing error');
      return templateBuffer;
    }
  }
  
  /**
   * Validate that template tags are properly formed
   */
  static validateTemplateTags(xmlContent: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for unmatched opening braces
    const openBraces = (xmlContent.match(/\{\{/g) || []).length;
    const closeBraces = (xmlContent.match(/\}\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push(`Unmatched braces: ${openBraces} opening, ${closeBraces} closing`);
    }
    
    // Check for broken tags (tags with XML inside)
    const brokenTags = xmlContent.match(/\{\{[^}]*?<[^>]*?>[^}]*?\}\}/g);
    if (brokenTags) {
      errors.push(`Found ${brokenTags.length} broken template tags with XML inside`);
      // Log first few examples
      brokenTags.slice(0, 5).forEach((tag, index) => {
        errors.push(`  Example ${index + 1}: ${tag}`);
      });
    }
    
    // Check for partial tags that might indicate splitting issues
    const partialOpenTags = xmlContent.match(/\{\{[^{}]*?<\/w:t>/g);
    if (partialOpenTags) {
      errors.push(`Found ${partialOpenTags.length} partial opening tags`);
    }
    
    const partialCloseTags = xmlContent.match(/<w:t[^>]*?>[^{}]*?\}\}/g);
    if (partialCloseTags) {
      errors.push(`Found ${partialCloseTags.length} partial closing tags`);
    }
    
    // Check for duplicate braces
    const duplicateOpen = xmlContent.match(/\{\{\{+/g);
    if (duplicateOpen) {
      errors.push(`Found ${duplicateOpen.length} instances of duplicate opening braces`);
    }
    
    const duplicateClose = xmlContent.match(/\}+\}\}/g);
    if (duplicateClose) {
      errors.push(`Found ${duplicateClose.length} instances of duplicate closing braces`);
    }
    
    // Extract all template tags and validate their content
    const allTags = xmlContent.match(/\{\{[^{}]*?\}\}/g) || [];
    const validTags = allTags.filter(tag => !tag.includes('<'));
    const invalidTags = allTags.filter(tag => tag.includes('<'));
    
    if (invalidTags.length > 0) {
      errors.push(`Found ${invalidTags.length} template tags with XML content`);
    }
    
    console.log(`Template validation: ${validTags.length} valid tags, ${invalidTags.length} invalid tags`);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Extract all template tags from XML content for debugging
   */
  private static extractTemplateTags(xmlContent: string): string[] {
    const tags = [];
    
    // Find all potential template tags (including broken ones)
    const allMatches = xmlContent.match(/\{\{[^{}]*?\}\}/g) || [];
    
    // Also look for partial tags
    const partialOpen = xmlContent.match(/\{\{[^{}]*?(?=<|$)/g) || [];
    const partialClose = xmlContent.match(/(?:^|>)[^{}]*?\}\}/g) || [];
    
    tags.push(...allMatches);
    tags.push(...partialOpen.map(tag => tag + ' [PARTIAL OPEN]'));
    tags.push(...partialClose.map(tag => '[PARTIAL CLOSE] ' + tag));
    
    return [...new Set(tags)]; // Remove duplicates
  }
}
