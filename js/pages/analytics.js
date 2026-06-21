
        function showCalendarAlert(day, info) {
            const now = new Date();
            const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
            const monthName = monthNames[now.getMonth()];
            if (info) {
                showToast("Dia " + day + " de " + monthName + " reservado para: " + info, 'warning');
            } else {
                showToast("Dia " + day + " de " + monthName + " livre para novas reservas!", 'success');
            }
        }


        function renderReservationsCalendar() {
            const grid = document.getElementById('reservations-calendar-grid');
            if (!grid) return;

            grid.innerHTML = '';

            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

            // Add headers
            const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
            weekdays.forEach(day => {
                const header = document.createElement('div');
                header.className = "calendar-header";
                header.innerText = day;
                grid.appendChild(header);
            });

            // Add faded days for previous month
            if (firstDayOfWeek > 0) {
                const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
                for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                    const fadedDay = document.createElement('div');
                    fadedDay.className = "calendar-day";
                    fadedDay.style.opacity = "0.3";
                    fadedDay.innerHTML = '<span class="day-num">' + (prevMonthDays - i) + '</span>';
                    grid.appendChild(fadedDay);
                }
            }

            // Fetch reservations to map booked days
            const bookedDays = {};
            const resvRows = Array.from(document.querySelectorAll('#tab-reservas table tbody tr'));
            resvRows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length >= 7) {
                    const area = cells[1].textContent.trim();
                    const resident = cells[2].textContent.trim();
                    const dateStr = cells[3].textContent.trim();
                    
                    let dayNum = null;
                    let matchMonth = false;
                    let matchYear = false;
                    if (dateStr.includes("/")) {
                        const parts = dateStr.split("/");
                        matchMonth = parseInt(parts[1], 10) === (currentMonth + 1);
                        matchYear = parseInt(parts[2], 10) === currentYear;
                        if (matchMonth && matchYear) dayNum = parseInt(parts[0], 10);
                    } else if (dateStr.includes("-")) {
                        const parts = dateStr.split("-");
                        matchMonth = parseInt(parts[1], 10) === (currentMonth + 1);
                        matchYear = parseInt(parts[0], 10) === currentYear;
                        if (matchMonth && matchYear) dayNum = parseInt(parts[2], 10);
                    }
                    
                    if (dayNum >= 1 && dayNum <= daysInMonth) {
                        if (!bookedDays[dayNum]) bookedDays[dayNum] = [];
                        bookedDays[dayNum].push({ area, resident });
                    }
                }
            });

            // Populate current month days
            for (let day = 1; day <= daysInMonth; day++) {
                const cell = document.createElement('div');
                cell.className = "calendar-day";
                if (day === now.getDate()) {
                    cell.style.border = '2px solid var(--color-primary)';
                }
                
                const dayBookings = bookedDays[day];
                if (dayBookings && dayBookings.length > 0) {
                    cell.classList.add('booked');
                    
                    let label = dayBookings[0].area;
                    if (label.length > 12) label = label.substring(0, 10) + "...";

                    cell.innerHTML = '<span class="day-num">' + day + '</span><span class="day-label" style="font-size:0.55rem; color:#ef4444; display:block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; margin-top:2px; font-weight:bold">' + label + '</span>';
                    
                    const detailsStr = dayBookings.map(b => b.area + " (" + b.resident + ")").join(', ');
                    cell.onclick = (function(d, det) {
                        return function() { showCalendarAlert(d, det); };
                    })(day, detailsStr);
                } else {
                    cell.innerHTML = '<span class="day-num">' + day + '</span>';
                    cell.onclick = (function(d) {
                        return function() { showCalendarAlert(d); };
                    })(day);
                }
                grid.appendChild(cell);
            }

            // Update calendar title
            const calendarTitle = document.querySelector('#tab-areas .page-section-title, #tab-areas .panel-title');
            if (calendarTitle) {
                calendarTitle.textContent = '📅 Calendário de Reservas — ' + monthNames[currentMonth] + ' ' + currentYear;
            }
        }
