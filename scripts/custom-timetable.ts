import './custom-timetable.ts'
const pageDegreeSubjects = new Set(
  JSON.parse(`{{ $pageDegreeSubjects | jsonify }}`)
);
const tmp = localStorage.getItem("selectedSubjects")
let selectedSubjects: Set<string>;
if (tmp != null) {
  selectedSubjects = new Set(
    JSON.parse(tmp),
  );
}


function toggleSubject(subjectId: string) {

  let button = document.getElementById("dialog-" + subjectId);
  if (button == null) {
    return
  }

  if (selectedSubjects.has(subjectId)) {  // If subject is in JSON, then remove it
    if (button.classList.contains("c-33502-disabled")) {
      button.classList.remove("c-33502-disabled")
      button.classList.add("c-33502")
    } else if (button.classList.contains("c-33508-disabled")) {
      button.classList.remove("c-33508-disabled")
      button.classList.add("c-33508")
    } else if (button.classList.contains("c-33516-disabled")) {
      button.classList.remove("c-33516-disabled")
      button.classList.add("c-33516")
    } else if (button.classList.contains("c-33503-disabled")) {
      button.classList.remove("c-33503-disabled")
      button.classList.add("c-33503")
    }

    button.classList.remove(
      "bg-black",
      "text-white",
      "dark:bg-white",
      "dark:text-black",
      "subjIsSelected"
    );
    button.classList.add(
      "bg-gray-50",
      "dark:bg-gray-900",
      "dark:text-white",
    );

    let subjectCode = subjectId.split("-")[0];

    // Hide this subject's timetable div only if the subject was not also added with another channel
    let otherSubjectIdsWithSameCode = Array.from(
      selectedSubjects,
    ).filter((item) => item.startsWith(subjectCode));
    if (otherSubjectIdsWithSameCode.length === 1) {
      let subject_div = document.getElementById(subjectCode);
      if (subject_div) subject_div.classList.add("hidden");
    }

    let channel_div = document.getElementById(subjectId);
    if (channel_div) channel_div.classList.add("hidden");

    selectedSubjects.delete(subjectId);
  } else {    // If subject is not in the JSON, then add it
    if (button.classList.contains("c-33502")) {
      button.classList.add("c-33502-disabled")
      button.classList.remove("c-33502")
    } else if (button.classList.contains("c-33508")) {
      button.classList.add("c-33508-disabled")
      button.classList.remove("c-33508")
    } else if (button.classList.contains("c-33516")) {
      button.classList.add("c-33516-disabled")
      button.classList.remove("c-33516")
    } else if (button.classList.contains("c-33503")) {
      button.classList.add("c-33503-disabled")
      button.classList.remove("c-33503")
    }

    button.classList.remove(
      "bg-gray-50",
      "dark:bg-gray-900",
      "dark:text-white",
    );
    button.classList.add(
      "bg-black",
      "text-white",
      "dark:bg-white",
      "dark:text-black",
      "subjIsSelected"
    );

    let subjectCode = subjectId.split("-")[0];
    let subject_div = document.getElementById(subjectCode);
    if (subject_div) subject_div.classList.remove("hidden");

    let channel_div = document.getElementById(subjectId);
    if (channel_div) channel_div.classList.remove("hidden");

    selectedSubjects.add(subjectId);
  }

  localStorage.setItem(
    "selectedSubjects",
    JSON.stringify(Array.from(selectedSubjects)),
  );

  fillTimetable("customSchedule", Array.from(selectedSubjects), Array.from(pageDegreeSubjects), 0);
}

addEventListener("DOMContentLoaded", () => {
  for (const subjectId of selectedSubjects) {
    const button = document.getElementById("dialog-" + subjectId);

    if (button) { // Check if the button exists
      if (button.classList.contains("c-33502")) {
        button.classList.add("c-33502-disabled");
        button.classList.remove("c-33502");
      } else if (button.classList.contains("c-33508")) {
        button.classList.add("c-33508-disabled");
        button.classList.remove("c-33508");
      } else if (button.classList.contains("c-33516")) {
        button.classList.add("c-33516-disabled");
        button.classList.remove("c-33516");
      } else if (button.classList.contains("c-33503")) {
        button.classList.add("c-33503-disabled");
        button.classList.remove("c-33503");
      }

      button.classList.remove(
        "bg-gray-50",
        "dark:bg-gray-900",
        "dark:text-white",
      );
      button.classList.add(
        "bg-black",
        "text-white",
        "dark:bg-white",
        "dark:text-black",
        "subjIsSelected"
      );
    }

    let subjectCode = subjectId.split("-")[0];
    let subject_div = document.getElementById(subjectCode);
    if (subject_div) subject_div.classList.remove("hidden");

    let channel_div = document.getElementById(subjectId);
    if (channel_div) channel_div.classList.remove("hidden");
  }

  fillTimetable("customSchedule", Array.from(selectedSubjects), Array.from(pageDegreeSubjects), 0);
});

function openSubjectsDialog() {
  document.getElementById("subjsPopUp").showModal();
}
function openDialog(const id) {
  document.getElementById(id).showModal();
}

function openCustomCourseDialog() {
  document.getElementById("subjsFormCoursePopUp").showModal();
}
function closeDialog(const id) {
  document.getElementById(id).close();
}
function closeSubjectsDialog() {
  document.getElementById("subjsPopUp").close();
}
