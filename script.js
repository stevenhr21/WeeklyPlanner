document.addEventListener('DOMContentLoaded', function() {
  // Hide modal initially
  const modal = document.getElementById('activityModal');
  modal.classList.add('hidden');
  modal.style.display = "none";

  // Dark/Light Mode Toggle
  const toggleThemeBtn = document.getElementById('toggleTheme');
  toggleThemeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
  });

  // Page Navigation
  const menuItems = document.querySelectorAll('.menu li');
  const pages = document.querySelectorAll('.page');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const pageId = item.dataset.page + 'View';
      pages.forEach(page => {
        page.style.display = (page.id === pageId) ? 'block' : 'none';
      });
    });
  });

  // Map emotion to emoji
  function getEmoji(emotion) {
    switch(emotion.toLowerCase()){
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'stressed': return '😰';
      case 'anxious': return '😟';
      case 'excited': return '😃';
      case 'calm': return '😌';
      case 'angry': return '😠';
      case 'bored': return '😐';
      case 'content': return '🙂';
      case 'frustrated': return '😤';
      default: return '';
    }
  }
  
  // Global data
  let activities = {};
  let selectedDate = new Date().toISOString().slice(0,10);
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  // Persistence via localStorage
  function loadActivities() {
    const stored = localStorage.getItem("weeklyPlannerActivities");
    if(stored) activities = JSON.parse(stored);
  }
  function saveActivities() {
    localStorage.setItem("weeklyPlannerActivities", JSON.stringify(activities));
  }
  loadActivities();

  // Ordinal suffix helper
  function getOrdinalSuffix(n) {
    let j = n % 10, k = n % 100;
    if(j === 1 && k !== 11) return n + "st";
    if(j === 2 && k !== 12) return n + "nd";
    if(j === 3 && k !== 13) return n + "rd";
    return n + "th";
  }
  
  // Daily View arrow buttons
  const prevDayBtn = document.getElementById('prevDay');
  const nextDayBtn = document.getElementById('nextDay');
  prevDayBtn.addEventListener('click', () => {
    let d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    selectedDate = d.toISOString().slice(0,10);
    renderDailyView();
  });
  nextDayBtn.addEventListener('click', () => {
    let d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    selectedDate = d.toISOString().slice(0,10);
    renderDailyView();
  });
  
  // Render Daily View with timeslot sections
  const dailyDateEl = document.getElementById('dailyDate');
  function renderDailyView() {
    dailyDateEl.textContent = new Date(selectedDate).toDateString();
    // Clear timeslot containers
    ["morningActivities", "afternoonActivities", "eveningActivities"].forEach(id => {
      document.getElementById(id).innerHTML = "";
    });
    const searchQuery = document.getElementById('searchActivity').value.toLowerCase();
    const dayActs = (activities[selectedDate] || []).filter(act => act.title.toLowerCase().includes(searchQuery));
    // Group by timeslot
    let groups = { "Morning": [], "Afternoon": [], "Evening": [] };
    dayActs.forEach(act => {
      groups[act.timeslot] = groups[act.timeslot] || [];
      groups[act.timeslot].push(act);
    });
    // For each timeslot, sort and render cards
    ["Morning", "Afternoon", "Evening"].forEach(slot => {
      groups[slot].sort((a, b) => (a.order || 0) - (b.order || 0));
      const container = document.getElementById(slot.toLowerCase() + "Activities");
      groups[slot].forEach((act, index) => {
        const emoji = getEmoji(act.emotion);
        const card = document.createElement("div");
        card.className = "activity-card";
        card.dataset.index = index;
        card.dataset.slot = slot;
        card.setAttribute("draggable", "true");
        card.innerHTML = `
          <div>
            <strong>${act.title}</strong><br>
            <small>${act.timeslot} | ${act.emotion} ${emoji} (${act.intensity}%)</small>
            ${act.notes ? `<br><em>${act.notes}</em>` : ''}
          </div>
          <div class="activity-actions">
            <button class="edit-activity" data-index="${index}" data-slot="${slot}" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="icon pencil-icon" viewBox="0 0 16 16">
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2L3 10.207V13h2.793L14 4.793 11.207 2z"/>
              </svg>
            </button>
            <button class="delete-activity" data-index="${index}" data-slot="${slot}" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="icon bin-icon" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 5h4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5v-7z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM11.882 4H4.118L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4z"/>
                <path d="M8 1a2 2 0 0 0-2 2h4a2 2 0 0 0-2-2z"/>
              </svg>
            </button>
          </div>
        `;
        // Card drag events
        card.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("application/json", JSON.stringify({ slot: slot, index: parseInt(index,10) }));
        });
        card.addEventListener("dragover", (e) => { e.preventDefault(); card.classList.add("drag-over"); });
        card.addEventListener("dragleave", (e) => { card.classList.remove("drag-over"); });
        card.addEventListener("drop", (e) => {
          e.preventDefault();
          e.stopPropagation();
          card.classList.remove("drag-over");
          const source = JSON.parse(e.dataTransfer.getData("application/json"));
          moveActivity(source.slot, source.index, slot, parseInt(index,10));
        });
        container.appendChild(card);
      });
      // Allow dropping onto container (for empty areas or appending)
      container.addEventListener("dragover", (e) => { e.preventDefault(); container.classList.add("drag-over"); });
      container.addEventListener("dragleave", (e) => { container.classList.remove("drag-over"); });
      container.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        container.classList.remove("drag-over");
        const source = JSON.parse(e.dataTransfer.getData("application/json"));
        moveActivity(source.slot, source.index, slot, container.childElementCount);
      });
    });
  }
  
  // Function to move an activity between timeslot groups
  function moveActivity(fromSlot, fromIndex, toSlot, toIndex) {
    fromIndex = parseInt(fromIndex, 10);
    toIndex = parseInt(toIndex, 10);
    let dayActs = activities[selectedDate] || [];
    let groups = { "Morning": [], "Afternoon": [], "Evening": [] };
    dayActs.forEach(act => {
      groups[act.timeslot] = groups[act.timeslot] || [];
      groups[act.timeslot].push(act);
    });
    ["Morning", "Afternoon", "Evening"].forEach(s => {
      groups[s].sort((a, b) => (a.order || 0) - (b.order || 0));
    });
    const [dragged] = groups[fromSlot].splice(fromIndex, 1);
    dragged.timeslot = toSlot;
    groups[toSlot].splice(toIndex, 0, dragged);
    ["Morning", "Afternoon", "Evening"].forEach(s => {
      groups[s].forEach((act, idx) => { act.order = idx; });
    });
    activities[selectedDate] = [].concat(groups["Morning"], groups["Afternoon"], groups["Evening"]);
    saveActivities();
    renderDailyView();
  }
  
  // Event delegation for delete and edit
  document.getElementById("dailyActivities").addEventListener("click", function(e) {
    const deleteBtn = e.target.closest(".delete-activity");
    const editBtn = e.target.closest(".edit-activity");
    if(deleteBtn) {
      const slot = deleteBtn.dataset.slot;
      const index = parseInt(deleteBtn.dataset.index,10);
      deleteActivity(slot, index);
    }
    if(editBtn) {
      const slot = editBtn.dataset.slot;
      const index = parseInt(editBtn.dataset.index,10);
      editActivity(slot, index);
    }
  });
  function deleteActivity(slot, index) {
    let dayActs = activities[selectedDate] || [];
    let groups = { "Morning": [], "Afternoon": [], "Evening": [] };
    dayActs.forEach(act => { groups[act.timeslot] = groups[act.timeslot] || []; groups[act.timeslot].push(act); });
    groups[slot].sort((a, b) => (a.order || 0) - (b.order || 0));
    groups[slot].splice(index, 1);
    ["Morning", "Afternoon", "Evening"].forEach(s => { groups[s].forEach((act, idx) => { act.order = idx; }); });
    activities[selectedDate] = [].concat(groups["Morning"], groups["Afternoon"], groups["Evening"]);
    saveActivities();
    renderDailyView();
  }
  function editActivity(slot, index) {
    let dayActs = activities[selectedDate] || [];
    let groups = { "Morning": [], "Afternoon": [], "Evening": [] };
    dayActs.forEach(act => { groups[act.timeslot] = groups[act.timeslot] || []; groups[act.timeslot].push(act); });
    groups[slot].sort((a, b) => (a.order || 0) - (b.order || 0));
    const act = groups[slot][index];
    document.getElementById('activityTitle').value = act.title;
    document.getElementById('activityCategory').value = act.category;
    document.getElementById('activityEmotion').value = act.emotion;
    document.getElementById('emotionIntensity').value = act.intensity;
    document.getElementById('intensityValue').textContent = act.intensity + '%';
    document.getElementById('activityTime').value = act.timeslot;
    document.getElementById('activityNotes').value = act.notes || "";
    document.getElementById('selectedDate').value = act.date;
    modal.classList.remove('hidden');
    modal.style.display = "flex";
    groups[slot].splice(index, 1);
    ["Morning", "Afternoon", "Evening"].forEach(s => { groups[s].forEach((item, idx) => { item.order = idx; }); });
    activities[selectedDate] = [].concat(groups["Morning"], groups["Afternoon"], groups["Evening"]);
    saveActivities();
    renderDailyView();
  }
  
  // Weekly View (unchanged)
  const weeklyContainer = document.getElementById('weeklyContainer');
  function renderWeeklyView() {
    weeklyContainer.innerHTML = '';
    const today = new Date();
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - today.getDay());
    for(let i = 0; i < 7; i++) {
      let d = new Date(firstDay);
      d.setDate(firstDay.getDate() + i);
      const dateStr = d.toISOString().slice(0,10);
      const dayDiv = document.createElement('div');
      dayDiv.className = 'week-day';
      dayDiv.innerHTML = `<h3>${d.toLocaleDateString('en-US', { weekday: 'long' })} – ${getOrdinalSuffix(d.getDate())} ${d.toLocaleString('default', { month: 'long' })}</h3>`;
      const acts = activities[dateStr] || [];
      acts.sort((a, b) => (a.order || 0) - (b.order || 0));
      acts.forEach(act => {
        const emoji = getEmoji(act.emotion);
        const card = document.createElement('div');
        card.className = 'activity-card';
        card.dataset.category = act.category;
        card.innerHTML = `<div>
             <strong>${act.title}</strong><br>
             <small>${act.timeslot} | ${act.emotion} ${emoji} (${act.intensity}%)</small>
         </div>`;
         dayDiv.appendChild(card);
      });
      weeklyContainer.appendChild(dayDiv);
    }
  }
  
  // Calendar View (unchanged)
  const calendarContainer = document.getElementById('calendarContainer');
  const calendarHeader = document.getElementById('calendarHeader');
  const calendarActivities = document.getElementById('calendarActivities');
  function renderCalendar() {
    calendarContainer.innerHTML = '';
    calendarHeader.innerHTML = `
      <button id="prevMonth">◀</button>
      <span id="monthYear">${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
      <button id="nextMonth">▶</button>
    `;
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
      const dayCell = document.createElement('div');
      dayCell.className = 'day-name';
      dayCell.textContent = day;
      grid.appendChild(dayCell);
    });
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for(let i = 0; i < firstDayOfMonth; i++){
      const blank = document.createElement('div');
      blank.className = 'day blank';
      grid.appendChild(blank);
    }
    for(let d = 1; d <= daysInMonth; d++){
      const dateStr = new Date(currentYear, currentMonth, d).toISOString().slice(0,10);
      const dayCell = document.createElement('div');
      dayCell.className = 'day';
      dayCell.textContent = d;
      if(activities[dateStr] && activities[dateStr].length > 0) {
        dayCell.classList.add('has-activity');
      }
      dayCell.addEventListener('click', () => {
        document.querySelectorAll('.calendar .day').forEach(el => el.classList.remove('selected'));
        dayCell.classList.add('selected');
        renderCalendarActivities(dateStr);
      });
      grid.appendChild(dayCell);
    }
    calendarContainer.appendChild(grid);
    document.getElementById('prevMonth').addEventListener('click', () => {
      currentMonth--;
      if(currentMonth < 0) { currentMonth = 11; currentYear--; }
      renderCalendar();
    });
    document.getElementById('nextMonth').addEventListener('click', () => {
      currentMonth++;
      if(currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderCalendar();
    });
  }
  function renderCalendarActivities(dateStr) {
    calendarActivities.innerHTML = `<h3>Activities for ${new Date(dateStr).toDateString()}</h3>`;
    const acts = activities[dateStr] || [];
    acts.sort((a, b) => (a.order || 0) - (b.order || 0));
    acts.forEach(act => {
      const emoji = getEmoji(act.emotion);
      const card = document.createElement('div');
      card.className = 'activity-card';
      card.dataset.category = act.category;
      card.innerHTML = `<div>
          <strong>${act.title}</strong><br>
          <small>${act.timeslot} | ${act.emotion} ${emoji} (${act.intensity}%)</small>
          ${act.notes ? `<br><em>${act.notes}</em>` : ''}
      </div>`;
      calendarActivities.appendChild(card);
    });
  }
  
  // Statistics & Dashboard (unchanged)
  function renderStatistics() {
    let totalActivities = 0, routineCount = 0, necessaryCount = 0, pleasurableCount = 0;
    let totalIntensity = 0, countIntensity = 0;
    let emotionCounts = {};
    for(let date in activities) {
      activities[date].forEach(act => {
         totalActivities++;
         totalIntensity += parseInt(act.intensity);
         countIntensity++;
         if(act.category === 'Routine') routineCount++;
         if(act.category === 'Necessary') necessaryCount++;
         if(act.category === 'Pleasurable') pleasurableCount++;
         const emo = act.emotion;
         emotionCounts[emo] = (emotionCounts[emo] || 0) + 1;
      });
    }
    const avgIntensity = countIntensity ? (totalIntensity/countIntensity).toFixed(1) : 0;
    document.getElementById('activitySummary').innerHTML = `
      <p>Total Activities: ${totalActivities}</p>
      <p>Routine: ${routineCount}</p>
      <p>Necessary: ${necessaryCount}</p>
      <p>Pleasurable: ${pleasurableCount}</p>
      <p>Avg. Intensity: ${avgIntensity}%</p>
    `;
    document.getElementById('statsContent').innerHTML = `<p>More detailed stats coming soon...</p>`;
    updateDashboard({routineCount, necessaryCount, pleasurableCount, emotionCounts});
  }
  
  let barChart, lineChart, pieChart;
  function updateDashboard({routineCount, necessaryCount, pleasurableCount, emotionCounts}) {
    const barCtx = document.getElementById('barChart').getContext('2d');
    if(barChart) barChart.destroy();
    barChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['Routine', 'Necessary', 'Pleasurable'],
        datasets: [{
          label: 'Activity Count',
          data: [routineCount, necessaryCount, pleasurableCount],
          backgroundColor: ['#81b29a', '#3d405b', '#e07a5f']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
    const dates = Object.keys(activities).sort();
    const lineLabels = [], lineData = [];
    dates.forEach(date => {
      const acts = activities[date];
      const total = acts.reduce((sum, act) => sum + parseInt(act.intensity), 0);
      const avg = (total / acts.length).toFixed(1);
      lineLabels.push(date);
      lineData.push(avg);
    });
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    if(lineChart) lineChart.destroy();
    lineChart = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: lineLabels,
        datasets: [{
          label: 'Avg. Intensity',
          data: lineData,
          borderColor: '#e07a5f',
          fill: false
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
    const pieLabels = Object.keys(emotionCounts);
    const pieData = Object.values(emotionCounts);
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    if(pieChart) pieChart.destroy();
    pieChart = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: pieLabels,
        datasets: [{
          label: 'Emotion Distribution',
          data: pieData,
          backgroundColor: pieLabels.map(label => {
            switch(label.toLowerCase()){
              case 'happy': return '#81b29a';
              case 'sad': return '#3d405b';
              case 'stressed': return '#e07a5f';
              case 'anxious': return '#f2cc8f';
              case 'excited': return '#e07a5f';
              case 'calm': return '#81b29a';
              case 'angry': return '#3d405b';
              case 'bored': return '#f2cc8f';
              case 'content': return '#81b29a';
              case 'frustrated': return '#e07a5f';
              default: return '#ccc';
            }
          })
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
  
  document.getElementById('exportCSV').addEventListener('click', () => {
    let csvContent = "data:text/csv;charset=utf-8,Date,Title,Category,Emotion,Intensity,Time,Notes\n";
    for(let date in activities) {
      activities[date].forEach(act => {
        csvContent += `${date},"${act.title}",${act.category},${act.emotion},${act.intensity},${act.timeslot},"${act.notes || ''}"\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "activities.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  
  document.getElementById('importCSVBtn').addEventListener('click', () => {
    document.getElementById('importCSV').click();
  });
  
  document.getElementById('importCSV').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { parseCSV(e.target.result); };
    reader.readAsText(file);
  });
  
  function parseCSV(csvText) {
    const lines = csvText.split("\n").slice(1);
    lines.forEach(line => {
      if(line.trim() === "") return;
      const [date, title, category, emotion, intensity, timeslot, notes] = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      const cleanTitle = title.replace(/"/g, '');
      if(!activities[date]) activities[date] = [];
      activities[date].push({
        title: cleanTitle,
        category: category,
        emotion: emotion,
        intensity: intensity,
        timeslot: timeslot,
        notes: notes.replace(/"/g, ''),
        order: activities[date].length
      });
    });
    saveActivities();
    renderDailyView();
    renderWeeklyView();
    renderCalendar();
    renderStatistics();
  }
  
  const activityForm = document.getElementById('activityForm');
  const openModalBtn = document.getElementById('openActivityModal');
  openModalBtn.addEventListener('click', () => {
    document.getElementById('selectedDate').value = selectedDate;
    modal.classList.remove('hidden');
    modal.style.display = "flex";
  });
  
  const closeModalBtn = document.querySelector('.modal .close');
  closeModalBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.style.display = "none";
    activityForm.reset();
    document.getElementById('intensityValue').textContent = '50%';
  });
  
  modal.addEventListener('click', (e) => {
    if(e.target === modal) {
      modal.classList.add('hidden');
      modal.style.display = "none";
      activityForm.reset();
      document.getElementById('intensityValue').textContent = '50%';
    }
  });
  
  const intensityInput = document.getElementById('emotionIntensity');
  intensityInput.addEventListener('input', (e) => {
    document.getElementById('intensityValue').textContent = e.target.value + '%';
  });
  
  activityForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('activityTitle').value;
    const category = document.getElementById('activityCategory').value;
    const emotion = document.getElementById('activityEmotion').value;
    const intensity = document.getElementById('emotionIntensity').value;
    const timeslot = document.getElementById('activityTime').value;
    const notes = document.getElementById('activityNotes').value;
    const date = document.getElementById('selectedDate').value;
    if(!activities[date]) activities[date] = [];
    activities[date].push({ title, category, emotion, intensity, timeslot, notes, date, order: activities[date].length });
    saveActivities();
    activityForm.reset();
    document.getElementById('intensityValue').textContent = '50%';
    modal.classList.add('hidden');
    modal.style.display = "none";
    if(date === selectedDate) renderDailyView();
    renderWeeklyView();
    renderCalendar();
    renderStatistics();
  });
  
  // Initial render
  renderDailyView();
  renderWeeklyView();
  renderCalendar();
  renderStatistics();
});
