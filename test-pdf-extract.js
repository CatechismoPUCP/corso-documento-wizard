// Test script to extract text from PDF and analyze format
const fs = require('fs');
const path = require('path');

// Simple Node.js script to read PDF using pdf-parse
let pdf;
try {
  pdf = require('pdf-parse');
} catch (error) {
  console.error('pdf-parse not found. Install with: npm install pdf-parse');
  process.exit(1);
}

async function testPDFExtraction() {
  try {
    const pdfPath = path.join(__dirname, 'public', 'esempi_pdf', 'ElencoStudentiEobSezione (1).pdf');
    console.log('Reading PDF from:', pdfPath);
    
    if (!fs.existsSync(pdfPath)) {
      console.error('PDF file not found at:', pdfPath);
      return;
    }
    
    const dataBuffer = fs.readFileSync(pdfPath);
    console.log('PDF file size:', dataBuffer.length, 'bytes');
    
    const data = await pdf(dataBuffer);
    
    console.log('=== PDF TEXT CONTENT ===');
    console.log(data.text);
    console.log('=== END PDF CONTENT ===');
    
    console.log('\n=== ANALYSIS ===');
    console.log('Total pages:', data.numpages);
    console.log('Text length:', data.text.length);
    
    // Split into lines and show first 20 lines
    const lines = data.text.split('\n').filter(line => line.trim());
    console.log('\n=== FIRST 20 LINES ===');
    lines.slice(0, 20).forEach((line, i) => {
      console.log(`${i + 1}: "${line}"`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testPDFExtraction();
