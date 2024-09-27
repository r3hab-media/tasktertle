document.addEventListener("DOMContentLoaded", function () {
	const selectMenu = document.getElementById("deptListing");

	const departments = [
		{ id: 1, name: "Airport" },
		{ id: 2, name: "Fire Department" },
		{ id: 3, name: "Police Department" },
		{ id: 4, name: "Public Works" },
	];

	selectMenu.innerHTML = "<option selected disabled>Choose...</option>";
	departments.forEach((department) => {
		const option = document.createElement("option");
		option.value = department.name;
		option.textContent = department.name;
		selectMenu.appendChild(option);
	});

	// Add an empty div in HTML to display the Bootstrap alert
	const alertContainer = document.getElementById("alertContainer");

	// Copy tasks to clipboard when button is clicked
	const copyButton = document.getElementById("copyTasks");
	copyButton.addEventListener("click", copyTasksToClipboard);

	function copyTasksToClipboard() {
		const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

		if (tasks.length === 0) {
			alert("No tasks to copy!");
			return;
		}

		let taskText = "";

		// Get today's date and week number
		const today = new Date();
		const todayFormatted = today.toLocaleDateString(undefined, {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
		const currentWeekNumber = getWeekNumber(today);

		// Add active hours before the task list, if available
		taskText += `Today's Date: ${todayFormatted}\n`;
		taskText += `Week#: ${currentWeekNumber}\n\n`;

		const dayStart = localStorage.getItem("dayStart");
		const dayEnd = localStorage.getItem("dayEnd");

		if (dayStart && dayEnd) {
			taskText += `Active today from ${convertTo12HourFormat(dayStart)} to ${convertTo12HourFormat(dayEnd)}\n\n`;
		} else {
			taskText += "No hours set for today.\n\n";
		}

		tasks.forEach((task, index) => {
			taskText += `Task ${index + 1}\n`;

			if (task.startTime && task.endTime) {
				taskText += `Task Time: ${convertTo12HourFormat(task.startTime)} to ${convertTo12HourFormat(task.endTime)} `;
			}

			if (task.deptListing && task.deptListing !== "Choose...") {
				taskText += `Assisted ${task.deptListing} in the following: ${task.taskDetails} `;
			} else {
				taskText += `${task.taskDetails}`;
			}

			if (task.cherwellTicket) {
				taskText += `This was part of Cherwell Ticket# ${task.cherwellTicket}. `;
			}

			if (task.yearlyGoal) {
				taskText += `This is part of my yearly goal of: ${task.yearlyGoal}. `;
			}

			taskText += "\n"; // Add a line break between tasks
		});

		// Copy to clipboard
		navigator.clipboard
			.writeText(taskText)
			.then(() => {
				// Display the Bootstrap alert
				showBootstrapAlert("Tasks copied to clipboard!", "success");
			})
			.catch((err) => {
				console.error("Error copying tasks to clipboard: ", err);
			});
	}

	// Function to display a Bootstrap alert
	function showBootstrapAlert(message, type) {
		// Clear any existing alerts
		alertContainer.innerHTML = "";

		const alertDiv = document.createElement("div");
		alertDiv.classList.add("alert", `alert-${type}`, "alert-dismissible", "fade", "show");
		alertDiv.setAttribute("role", "alert");
		alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

		alertContainer.appendChild(alertDiv);

		// Automatically remove the alert after 5 seconds
		setTimeout(() => {
			alertDiv.classList.remove("show");
			alertDiv.classList.add("fade");
			alertDiv.remove();
		}, 3000);
	}

	// Function to handle checkbox and input toggle
	function toggleInput(checkboxId, inputId) {
		const checkbox = document.getElementById(checkboxId);
		const input = document.getElementById(inputId);

		checkbox.addEventListener("change", function () {
			input.style.display = this.checked ? "block" : "none"; // Show input when checked, hide when unchecked
		});

		// Trigger initial toggle on page load
		input.style.display = checkbox.checked ? "block" : "none"; // Apply based on initial checkbox state
	}

	// Initialize toggle functionality for each checkbox-input pair
	toggleInput("yearlyGoal", "yearlyGoalInput");
	toggleInput("cherwellTicket", "ticketNumber");

	// Day Start and Day End handling
	const dayStartInput = document.getElementById("dayStartInput");
	const dayEndInput = document.getElementById("dayEndInput");
	const workDayHours = document.getElementById("workDayHours");
	const saveButton = document.querySelector("#dayStartsModal .btn-primary");

	saveButton.addEventListener("click", function () {
		const dayStartValue = dayStartInput.value;
		const dayEndValue = dayEndInput.value;
		localStorage.setItem("dayStart", dayStartValue);
		localStorage.setItem("dayEnd", dayEndValue);

		displayWorkDayHours();
	});

	// Function to display work day hours and append the clear button
	function displayWorkDayHours() {
		const storedDayStart = localStorage.getItem("dayStart");
		const storedDayEnd = localStorage.getItem("dayEnd");

		// Get today's date
		const today = new Date();
		const options = {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		};
		const todayFormatted = today.toLocaleDateString(undefined, options);

		// Get current week number
		const currentWeekNumber = getWeekNumber(today);

		// Display today's date and week number above work hours
		const dateDisplay = `<p><strong>Today's Date: ${todayFormatted}</strong></p>`;
		const weekDisplay = `<p><strong>Week# ${currentWeekNumber}</strong></p>`;

		workDayHours.innerHTML = dateDisplay + weekDisplay;

		// If day start and end times exist, calculate task time percentage
		if (storedDayStart && storedDayEnd) {
			const dayStartMinutes = convertTimeToMinutes(storedDayStart);
			const dayEndMinutes = convertTimeToMinutes(storedDayEnd);
			const totalWorkDayMinutes = dayEndMinutes - dayStartMinutes;

			// Calculate total task minutes
			const totalTaskMinutes = calculateTotalTaskMinutes();
			const percentageOfWorkDay = ((totalTaskMinutes / totalWorkDayMinutes) * 100).toFixed(1); // One decimal place

			// Display work day hours and task percentage
			const dayStartFormatted = convertTo12HourFormat(storedDayStart);
			const dayEndFormatted = convertTo12HourFormat(storedDayEnd);

			workDayHours.innerHTML += `
      <div style="display: flex; align-items: center;">
        <p style="margin: 0;">
          <strong>Day Start: </strong> ${dayStartFormatted} | <strong>Day End: </strong> ${dayEndFormatted}
        </p>
        <button class="btn btn-sm btn-outline-danger ms-2">Delete Hours</button>
      </div>
      <p>Your total tasks accounted for <strong>${percentageOfWorkDay}%</strong> of your total work day hours.</p>
    `;

			// Attach event listener to delete button
			const clearButton = workDayHours.querySelector("button");
			clearButton.addEventListener("click", clearWorkDayHours);
		} else {
			workDayHours.innerHTML += "<p>No times set for today.</p>";
		}
	}

	// Function to calculate total task minutes from all tasks
	function calculateTotalTaskMinutes() {
		const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
		let totalMinutes = 0;

		tasks.forEach((task) => {
			if (task.startTime && task.endTime) {
				const startMinutes = convertTimeToMinutes(task.startTime);
				const endMinutes = convertTimeToMinutes(task.endTime);
				totalMinutes += endMinutes - startMinutes;
			}
		});

		return totalMinutes;
	}

	// Function to convert time (HH:mm) to total minutes
	function convertTimeToMinutes(time) {
		const [hours, minutes] = time.split(":").map(Number);
		return hours * 60 + minutes;
	}

	// Function to convert 24-hour time (HH:mm) to 12-hour format with a.m. / p.m.
	function convertTo12HourFormat(time) {
		const [hours, minutes] = time.split(":");
		let period = "a.m.";
		let hour = parseInt(hours, 10);

		if (hour >= 12) {
			period = "p.m.";
			if (hour > 12) hour -= 12;
		} else if (hour === 0) {
			hour = 12;
		}

		return `${hour}:${minutes} ${period}`;
	}

	// Function to calculate the current week number
	function getWeekNumber(d) {
		const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
		const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
		return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
	}

	// Function to clear work day hours
	function clearWorkDayHours() {
		localStorage.removeItem("dayStart");
		localStorage.removeItem("dayEnd");
		workDayHours.innerHTML = "No times set for today.";
	}

	// Handle task submission
	const submitButton = document.getElementById("submitTask");
	submitButton.addEventListener("click", submitTask);

	function submitTask() {
		const taskDetails = document.getElementById("taskDetails").value;
		const yearlyGoal = document.getElementById("yearlyGoal").checked ? document.getElementById("yearlyGoalInput").value : "";
		const startTime = document.getElementById("startTime").value;
		const endTime = document.getElementById("endTime").value;
		const deptListing = document.getElementById("deptListing").value;
		const cherwellTicket = document.getElementById("cherwellTicket").checked ? document.getElementById("ticketNumber").value : "";

		const task = {
			taskDetails,
			yearlyGoal,
			startTime,
			endTime,
			deptListing,
			cherwellTicket,
		};

		let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
		tasks.push(task);
		localStorage.setItem("tasks", JSON.stringify(tasks));

		displayTasks();
		resetForm();

		// Recalculate percentage of work day after adding task
		displayWorkDayHours();
	}

	// Display tasks from localStorage
	function displayTasks() {
		const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
		const updatedTasks = document.getElementById("updatedTasks");

		// Retrieve the stored dayStart and dayEnd values from localStorage
		const dayStart = localStorage.getItem("dayStart");
		const dayEnd = localStorage.getItem("dayEnd");

		// Get today's date and week number
		const today = new Date();
		const todayFormatted = today.toLocaleDateString(undefined, {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
		const currentWeekNumber = getWeekNumber(today);

		// Clear previous tasks
		updatedTasks.innerHTML = "";

		// Display today's date, week number, and active hours before the task list
		updatedTasks.innerHTML += `<p><strong>Today's Date: ${todayFormatted}</strong></p>`;
		updatedTasks.innerHTML += `<p><strong>Week#: ${currentWeekNumber}</strong></p>`;

		if (dayStart && dayEnd) {
			const dayStart12Hour = convertTo12HourFormat(dayStart);
			const dayEnd12Hour = convertTo12HourFormat(dayEnd);
			updatedTasks.innerHTML += `<p><strong>Active today from ${dayStart12Hour} to ${dayEnd12Hour}</strong></p>`;
		} else {
			updatedTasks.innerHTML += `<p><strong>No hours set for today.</strong></p>`;
		}

		// Loop through tasks and display them
		tasks.forEach((task, index) => {
			const taskElement = document.createElement("div");
			taskElement.classList.add("task-item", "p-2", "mb-2", "border", "rounded");

			let taskMessage = "";

			if (task.startTime && task.endTime) {
				taskMessage += `Task Time: ${convertTo12HourFormat(task.startTime)} to ${convertTo12HourFormat(task.endTime)} `;
			}

			if (task.deptListing && task.deptListing !== "Choose...") {
				taskMessage += `Assisted ${task.deptListing} in the following: ${task.taskDetails} `;
			} else {
				taskMessage += `${task.taskDetails}. `;
			}

			if (task.cherwellTicket) {
				taskMessage += `This was part of Cherwell Ticket# ${task.cherwellTicket}. `;
			}

			if (task.yearlyGoal) {
				taskMessage += `This is part of my yearly goal of: ${task.yearlyGoal}. `;
			}

			let taskHTML = `<h5>Task ${index + 1}</h5><p>${taskMessage}</p>
      <button class="btn btn-sm btn-primary edit-task" data-index="${index}">Edit</button>
      <button class="btn btn-sm btn-danger delete-task" data-index="${index}">Delete</button>`;

			taskElement.innerHTML = taskHTML;
			updatedTasks.appendChild(taskElement);
		});

		document.querySelectorAll(".edit-task").forEach((button) => {
			button.addEventListener("click", function () {
				const index = this.getAttribute("data-index");
				editTask(index);
			});
		});

		document.querySelectorAll(".delete-task").forEach((button) => {
			button.addEventListener("click", function () {
				const index = this.getAttribute("data-index");
				deleteTask(index);
			});
		});
	}

	// Function to edit a task
	function editTask(index) {
		const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
		const task = tasks[index];

		// Populate form with task details
		document.getElementById("taskDetails").value = task.taskDetails;
		document.getElementById("yearlyGoal").checked = task.yearlyGoal !== "";
		document.getElementById("yearlyGoalInput").value = task.yearlyGoal;
		document.getElementById("startTime").value = task.startTime;
		document.getElementById("endTime").value = task.endTime;
		document.getElementById("deptListing").value = task.deptListing;
		document.getElementById("cherwellTicket").checked = task.cherwellTicket !== "";
		document.getElementById("ticketNumber").value = task.cherwellTicket;

		document.getElementById("yearlyGoal").dispatchEvent(new Event("change"));
		document.getElementById("cherwellTicket").dispatchEvent(new Event("change"));

		const submitButton = document.getElementById("submitTask");
		submitButton.textContent = "Update Task";

		submitButton.removeEventListener("click", submitTask); // Remove existing submit listener
		submitButton.addEventListener("click", function updateTask() {
			task.taskDetails = document.getElementById("taskDetails").value;
			task.yearlyGoal = document.getElementById("yearlyGoal").checked ? document.getElementById("yearlyGoalInput").value : "";
			task.startTime = document.getElementById("startTime").value;
			task.endTime = document.getElementById("endTime").value;
			task.deptListing = document.getElementById("deptListing").value;
			task.cherwellTicket = document.getElementById("cherwellTicket").checked ? document.getElementById("ticketNumber").value : "";

			tasks[index] = task;
			localStorage.setItem("tasks", JSON.stringify(tasks));

			submitButton.textContent = "Submit Task";
			submitButton.removeEventListener("click", updateTask);
			submitButton.addEventListener("click", submitTask);

			displayTasks();
			resetForm();

			// Recalculate percentage of work day after editing task
			displayWorkDayHours();
		});
	}

	// Function to delete a specific task
	function deleteTask(index) {
		let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
		tasks.splice(index, 1); // Remove the task at the specified index
		localStorage.setItem("tasks", JSON.stringify(tasks)); // Update localStorage
		displayTasks(); // Refresh the task list

		// Recalculate percentage of work day after deleting task
		displayWorkDayHours();
	}

	// Function to clear all tasks
	document.getElementById("clearTasks").addEventListener("click", function () {
		localStorage.removeItem("tasks"); // Clear tasks from localStorage
		displayTasks(); // Refresh the task list
	});

	// Function to reset form fields after submission or edit
	function resetForm() {
		document.getElementById("taskDetails").value = "";
		document.getElementById("yearlyGoal").checked = false;
		document.getElementById("yearlyGoalInput").value = "";
		document.getElementById("startTime").value = "";
		document.getElementById("endTime").value = "";
		document.getElementById("deptListing").value = "";
		document.getElementById("cherwellTicket").checked = false;
		document.getElementById("ticketNumber").value = "";
	}

	// Display work day hours and tasks on initial page load
	displayWorkDayHours();
	displayTasks();
});

if ("serviceWorker" in navigator) {
	window.addEventListener("load", function () {
		navigator.serviceWorker.register("/service-worker.js").then(
			function (registration) {
				console.log("Service Worker registered with scope: ", registration.scope);
			},
			function (error) {
				console.log("Service Worker registration failed: ", error);
			}
		);
	});
}

let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
	e.preventDefault();
	deferredPrompt = e;
	const installButton = document.getElementById("installButton");
	installButton.classList.remove("d-none");

	installButton.addEventListener("click", () => {
		installButton.classList.add("d-none");
		deferredPrompt.prompt();
		deferredPrompt.userChoice.then((choiceResult) => {
			if (choiceResult.outcome === "accepted") {
				console.log("User accepted the install prompt");
			} else {
				console.log("User dismissed the install prompt");
			}
			deferredPrompt = null;
		});
	});
});

window.addEventListener("appinstalled", (evt) => {
	console.log("PWA was installed successfully");
});
