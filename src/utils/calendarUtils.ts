import { CourseData } from '@/types/course';

export const calculateFADHours = (lessons: any[]): number => {
  console.log('Calculating FAD hours for online lessons:', lessons);
  
  let totalFADHours = 0;
  
  const onlineLessons = lessons.filter(lesson => lesson.location === 'Online');
  
  onlineLessons.forEach(lesson => {
    const startTime = lesson.startTime.split(':').map(Number);
    const endTime = lesson.endTime.split(':').map(Number);
    
    const startMinutes = startTime[0] * 60 + startTime[1];
    const endMinutes = endTime[0] * 60 + endTime[1];
    
    let lessonMinutes = endMinutes - startMinutes;
    
    // Check if lesson spans lunch break (13:00-14:00)
    const lunchStart = 13 * 60; // 13:00 in minutes
    const lunchEnd = 14 * 60;   // 14:00 in minutes
    
    if (startMinutes < lunchEnd && endMinutes > lunchStart) {
      // Lesson spans lunch break, subtract 1 hour (60 minutes)
      const overlapStart = Math.max(startMinutes, lunchStart);
      const overlapEnd = Math.min(endMinutes, lunchEnd);
      const lunchOverlap = overlapEnd - overlapStart;
      lessonMinutes -= lunchOverlap;
      console.log(`Lesson ${lesson.subject} on ${lesson.date}: removed ${lunchOverlap} minutes for lunch break`);
    }
    
    totalFADHours += lessonMinutes / 60;
  });
  
  console.log('Total FAD hours calculated:', totalFADHours);
  return Math.round(totalFADHours * 100) / 100; // Round to 2 decimal places
};

export const generateGoogleCalendarUrl = (data: CourseData) => {
  const lessons = data.parsedCalendar.lessons;
  if (lessons.length === 0) {
    alert('Nessuna lezione trovata per generare il link Google Calendar.');
    return;
  }

  // Create multiple Google Calendar URLs for all lessons
  lessons.forEach((lesson, index) => {
    const [day, month, year] = lesson.date.split('/');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Format dates for Google Calendar
    const formatDateForGoogle = (date: Date, time: string) => {
      const [hours, minutes] = time.split(':');
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      return newDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDateTime = formatDateForGoogle(startDate, lesson.startTime);
    const endDateTime = formatDateForGoogle(startDate, lesson.endTime);
    
    const title = encodeURIComponent(`${data.courseName} - ${lesson.subject}`);
    const details = encodeURIComponent(`Corso: ${data.courseName}\nDocente: ${data.mainTeacher}\nModalità: ${lesson.location}\nLezione ${index + 1} di ${lessons.length}`);
    const location = encodeURIComponent(lesson.location === 'Ufficio' ? data.location || 'In presenza' : 'Online');

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}`;
    
    // Open each event in a new tab with a small delay
    setTimeout(() => {
      window.open(googleUrl, '_blank');
    }, index * 500); // 500ms delay between each opening
  });
};

export const generateOutlookCalendarUrl = (data: CourseData) => {
  const lessons = data.parsedCalendar.lessons;
  if (lessons.length === 0) {
    alert('Nessuna lezione trovata per generare il link Outlook.');
    return;
  }

  // Create multiple Outlook Calendar URLs for all lessons
  lessons.forEach((lesson, index) => {
    const [day, month, year] = lesson.date.split('/');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const formatDateForOutlook = (date: Date, time: string) => {
      const [hours, minutes] = time.split(':');
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      return newDate.toISOString();
    };

    const startDateTime = formatDateForOutlook(startDate, lesson.startTime);
    const endDateTime = formatDateForOutlook(startDate, lesson.endTime);
    
    const title = encodeURIComponent(`${data.courseName} - ${lesson.subject}`);
    const body = encodeURIComponent(`Corso: ${data.courseName}\nDocente: ${data.mainTeacher}\nModalità: ${lesson.location}\nLezione ${index + 1} di ${lessons.length}`);
    const location = encodeURIComponent(lesson.location === 'Ufficio' ? data.location || 'In presenza' : 'Online');

    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startDateTime}&enddt=${endDateTime}&body=${body}&location=${location}`;
    
    // Open each event in a new tab with a small delay
    setTimeout(() => {
      window.open(outlookUrl, '_blank');
    }, index * 500); // 500ms delay between each opening
  });
};

export const generateTeamsUrl = (data: CourseData) => {
  const lessons = data.parsedCalendar.lessons.filter(lesson => lesson.location === 'Online');
  if (lessons.length === 0) {
    alert('Nessuna lezione online trovata per generare meeting Teams.');
    return;
  }

  // Create Teams meetings only for online lessons
  lessons.forEach((lesson, index) => {
    const [day, month, year] = lesson.date.split('/');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const title = encodeURIComponent(`${data.courseName} - ${lesson.subject}`);
    const startTime = encodeURIComponent(`${lesson.date} ${lesson.startTime}`);
    const endTime = encodeURIComponent(`${lesson.date} ${lesson.endTime}`);
    
    // Microsoft Teams meeting URL format
    const teamsUrl = `https://teams.microsoft.com/l/meeting/new?subject=${title}&startTime=${startTime}&endTime=${endTime}`;
    
    // Open each meeting in a new tab with a small delay
    setTimeout(() => {
      window.open(teamsUrl, '_blank');
    }, index * 500); // 500ms delay between each opening
  });
};

export const downloadICalendar = (data: CourseData) => {
  const lessons = data.parsedCalendar.lessons;
  if (lessons.length === 0) {
    alert('Nessuna lezione trovata per generare il file calendario.');
    return;
  }

  // Generate iCal format with ALL lessons
  let icalContent = 'BEGIN:VCALENDAR\n';
  icalContent += 'VERSION:2.0\n';
  icalContent += 'PRODID:-//Lovable//Course Calendar//EN\n';
  icalContent += 'CALSCALE:GREGORIAN\n';
  icalContent += `X-WR-CALNAME:${data.courseName}\n`;
  icalContent += `X-WR-CALDESC:Calendario completo del corso ${data.courseName} - ${data.mainTeacher}\n`;

  lessons.forEach((lesson, index) => {
    const [day, month, year] = lesson.date.split('/');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const formatDateForICal = (date: Date, time: string) => {
      const [hours, minutes] = time.split(':');
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      return newDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDateTime = formatDateForICal(startDate, lesson.startTime);
    const endDateTime = formatDateForICal(startDate, lesson.endTime);
    const uid = `lesson-${data.sectionId}-${index}@course-calendar.com`;
    
    icalContent += 'BEGIN:VEVENT\n';
    icalContent += `UID:${uid}\n`;
    icalContent += `DTSTART:${startDateTime}\n`;
    icalContent += `DTEND:${endDateTime}\n`;
    icalContent += `SUMMARY:${data.courseName} - ${lesson.subject}\n`;
    icalContent += `DESCRIPTION:Corso: ${data.courseName}\\nDocente: ${data.mainTeacher}\\nModalità: ${lesson.location}\\nLezione ${index + 1} di ${lessons.length}\n`;
    icalContent += `LOCATION:${lesson.location === 'Ufficio' ? (data.location || 'In presenza') : 'Online'}\n`;
    icalContent += 'STATUS:CONFIRMED\n';
    icalContent += 'SEQUENCE:0\n';
    icalContent += 'END:VEVENT\n';
  });

  icalContent += 'END:VCALENDAR';

  // Download the file
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `calendario_completo_${data.sectionId}.ics`;
  a.click();
  URL.revokeObjectURL(url);
};
