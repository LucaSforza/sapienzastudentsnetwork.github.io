const COURSES = JSON.parse(`{{ .Site.Data.courses | jsonify (dict "noHTMLEscape" true) }}`);
const TIMETABLES: { [key: string]: any } = JSON.parse(`{{ .Site.Data.timetables | jsonify (dict "noHTMLEscape" true) }}`);
const HARDCODED_TIMETABLES = JSON.parse(`{{ .Site.Data.hardcodedTimetables | jsonify }}`)
const COLORS = ['red', 'yellow', 'green', 'blue', 'purple', 'orange', 'emerald', 'cyan', 'fuchsia', 'teal'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

for (const courseId in HARDCODED_TIMETABLES) {
  if (TIMETABLES[courseId]) {
    const channelsToUpdate = HARDCODED_TIMETABLES[courseId].channels;

    // Iterate over the channels to be updated
    for (const channelId in channelsToUpdate) {
      TIMETABLES[courseId].channels[channelId] = channelsToUpdate[channelId];
    }
  } else if (HARDCODED_TIMETABLES[courseId]) {
    TIMETABLES[courseId] = HARDCODED_TIMETABLES[courseId];
  }
}

function fillTimetable(tableId: string, courses: string[], degreeCourseCodes: string, channel: string) {
  let classesStartTime = undefined,
    classesEndTime = undefined;

  const schedule: { [key: string]: any[] } = Object.fromEntries(DAYS.map(day => [day, []]));

  for (const course of courses) {
    const [courseCode, _channel] = course.toString().split('-');

    if (!degreeCourseCodes.includes(courseCode))
      continue;
    if (!TIMETABLES[courseCode])
      continue;

    let requestedChannel = _channel || channel;

    // Get requested channel timetable
    let channelDays: { [key: string]: any[] } = TIMETABLES[courseCode]['channels'][requestedChannel] || {};

    // Always include channel 0 timetable, unless the requested channel is already 0
    let channel0Days: { [key: string]: any[] } = (requestedChannel !== "0")
      ? (TIMETABLES[courseCode]['channels']['0'] || {})
      : {};

    // Merge requested channel with channel 0
    let days: { [key: string]: any[] } = {};
    for (let [day, hours] of Object.entries(channelDays)) {
      days[day] = (days[day] || []).concat(hours);
    }
    for (let [day, hours] of Object.entries(channel0Days)) {
      days[day] = (days[day] || []).concat(hours);
    }

    for (let [day, hours] of Object.entries(days)) {
      if (!Array.isArray(hours))
        hours = [hours]

      for (const time of hours) {
        const [startTime, endTime] = time.timeslot.split('-').map((time: string) => parseInt(time))
        const alerts = COURSES[courseCode].alerts;

        let cancelled = time.cancelled === true;

        // Regex pattern to match Roman numerals (I, II, III, IV, V, IX, X, XI) or alphanumeric room identifiers (e.g., A1, B2, RM018)
        const classroomPattern = /\b(Zoom|Meet|I{1,3}|IV|V{1,3}|IX|X|XI bis|XI|Alfa|Magna|G|Tullio)\b|\b[A-Za-z]*\d+[A-Za-z]*\b/;

        // Determine the source of classroom information
        let classrooms = time.classroomInfo
          ? // If time.classroomInfo is present, use an IIFE (Immediately Invoked Function Expression) for scoping
          (() => {
            // Match the classroom information against the pattern
            const match = time.classroomInfo.match(classroomPattern);
            if (match) {
              let roomNumber = match[0]; // Extract the matched room number
              // If the classroom information contains "RM018" (Aule L Castro Laurenziano), append "L" to the room number
              return time.classroomInfo.includes("RM018") ? roomNumber + "L" : roomNumber;
            }
            return null; // Return null if no match is found
          })()
          : time.classrooms
            ? // If time.classrooms is present, map through its values
            Object.values(time.classrooms).map((room: any) => {
              // Match the room string against the classroom pattern
              const match = room.match(classroomPattern);
              if (match) {
                let roomNumber = match[0]; // Extract the matched room number
                // If the room string contains "RM018" (Aule L Castro Laurenziano), append "L" to the room number
                return room.includes("RM018") ? roomNumber + "L" : roomNumber;
              }
              return null; // Return null if no match is found
            }).filter(Boolean).join(', ') // Filter out null values and join the results into a single string
            : null; // Return null if neither classrooms nor classroomInfo are present

        let en_day = {
          'lunedì': 'monday',
          'martedì': 'tuesday',
          'mercoledì': 'wednesday',
          'giovedì': 'thursday',
          'venerdì': 'friday',
          'sabato': 'saturday',
          'domenica': 'sunday',
        }[day]

        schedule[en_day as string].push({ courseCode: courseCode, startTime, endTime, alerts: alerts && alerts[channel] && alerts[channel][day], cancelled: cancelled, classroomDesc: classrooms || null });

        classesStartTime = Math.min((classesStartTime as number), startTime) || startTime;
        classesEndTime = Math.max((classesEndTime as number), endTime) || endTime;
      }
    }
  }

  let subjectsColors: { [key: string]: any } = {}, nextColorIndex = 0;

  const desktopTbody = document.querySelector(`#${tableId} tbody.desktop`);
  const mobileTbody = document.querySelector(`#${tableId} tbody.mobile`);
  if (desktopTbody == null) {
    throw "desktopTbody is null";
  }
  desktopTbody.innerHTML = '';
  if (mobileTbody == null) {
    throw "mobileTbody is null";
  }
  mobileTbody.innerHTML = '';

  let tableHasAlerts = false;
  for (let time = classesStartTime; time < classesEndTime; time++) {
    const timeTd = document.createElement('td');
    timeTd.classList.add('timetableTableCell', 'font-light', 'italic');
    timeTd.innerHTML = `${time} - ${time + 1}`;

    const desktopTr = document.createElement('tr');
    desktopTr.append(timeTd);

    const mobileTr = document.createElement('tr');
    mobileTr.append(timeTd.cloneNode(true));

    for (const day of DAYS) {
      if (!schedule[day])
        continue;

      const desktopTd = document.createElement('td');
      const mobileTd = document.createElement('td');

      desktopTd.classList.add('timetableTableCell');
      mobileTd.classList.add('timetableTableCell');

      const courses = schedule[day]
        .filter(({ startTime, endTime }) => startTime <= time && endTime > time);

      let hasMoreThanACourse = false;
      let desktopCourseLink;
      for (const { courseCode, alerts, cancelled, classroomDesc } of courses) {
        const course = COURSES[courseCode];

        desktopCourseLink = document.createElement('a');
        if (!subjectsColors[courseCode])
          subjectsColors[courseCode] = COLORS[nextColorIndex++ % COLORS.length];

        desktopCourseLink.classList.add(subjectsColors[courseCode], 'font-bold', 'underlined-text');
        if (cancelled) {
          desktopCourseLink.classList.add('cancelledSchedule');
        }
        desktopCourseLink.href = `#${courseCode}`
        desktopCourseLink.textContent = course ?
          course.shortName || course.name : courseCode;

        let mobileCourseLink = desktopCourseLink.cloneNode(true);
        mobileCourseLink.textContent = course ?
          course.abbr || course.name.substring(0, 2).toUpperCase() : courseCode;

        if (alerts) {
          desktopCourseLink.textContent += '*';
          mobileCourseLink.textContent += '*';

          tableHasAlerts = true;
        }

        if (hasMoreThanACourse) {
          desktopTd.append(document.createElement('br'));
          mobileTd.append(document.createElement('br'));
        }

        hasMoreThanACourse = true;

        desktopTd.append(desktopCourseLink);
        mobileTd.append(mobileCourseLink);

        if (classroomDesc != null) {
          const classroomDescElem = document.createElement('div');
          classroomDescElem.classList.add('font-italic');
          classroomDescElem.textContent = "(" + classroomDesc + ")";

          desktopTd.append(classroomDescElem);
          mobileTd.append(classroomDescElem);
        }
      }

      desktopTr.append(desktopTd);
      mobileTr.append(mobileTd);
    }

    if (desktopTbody == null) {
      throw "desktopTbody is null";

    }
    if (mobileTbody == null) {
      throw "mobileTbody is null";

    }
    desktopTbody.append(desktopTr);
    mobileTbody.append(mobileTr);
  }


  let alertsLegend = document.getElementById("alertsLegend");

  if (tableHasAlerts) {
    if (!alertsLegend) {
      alertsLegend = document.createElement("div");
      alertsLegend.id = "alertsLegend";
      alertsLegend.textContent = '* ⚠️ {{ T "Subjs_Timetables_AlertsLegend" }}';
      const table = document.getElementById(tableId)
      if (table == null) {
        throw "table is null";

      }

      table.insertAdjacentElement('afterend', alertsLegend);
    }
  } else if (alertsLegend)
    alertsLegend.remove();
}
