
export interface ParsedZoomData {
  link: string;
  meetingId: string;
  passcode: string;
}

export const parseZoomData = (zoomText: string): ParsedZoomData | null => {
  if (!zoomText.trim()) {
    return null;
  }

  console.log('Parsing Zoom data:', zoomText);

  // Initialize result
  const result: ParsedZoomData = {
    link: '',
    meetingId: '',
    passcode: ''
  };

  // Extract Zoom link (https://... pattern)
  const linkMatch = zoomText.match(/https:\/\/[^\s]+/);
  if (linkMatch) {
    result.link = linkMatch[0];
  }

  // Extract Meeting ID (various formats: XXX XXXX XXXX, XXX-XXXX-XXXX, XXXXXXXXXXX)
  const idMatches = [
    /ID riunione:\s*(\d{3}\s\d{4}\s\d{4})/i,
    /ID riunione:\s*(\d{3}-\d{4}-\d{4})/i,
    /ID riunione:\s*(\d{11})/i,
    /(\d{3}\s\d{4}\s\d{4})/,
    /(\d{3}-\d{4}-\d{4})/,
    /(\d{11})/
  ];

  for (const pattern of idMatches) {
    const match = zoomText.match(pattern);
    if (match) {
      result.meetingId = match[1];
      break;
    }
  }

  // Extract Passcode
  const passcodeMatches = [
    /Passcode:\s*(\w+)/i,
    /Password:\s*(\w+)/i,
    /Codice:\s*(\w+)/i
  ];

  for (const pattern of passcodeMatches) {
    const match = zoomText.match(pattern);
    if (match) {
      result.passcode = match[1];
      break;
    }
  }

  console.log('Parsed Zoom data:', result);

  // Return null if no essential data found
  if (!result.link && !result.meetingId) {
    return null;
  }

  return result;
};

export const formatZoomData = (data: ParsedZoomData): string => {
  return `Link: ${data.link}\nID riunione: ${data.meetingId}\nPasscode: ${data.passcode}`;
};
