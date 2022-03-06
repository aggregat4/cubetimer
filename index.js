let timerStart = null
let timerStop = Date.now()
let lastMouseDownTime = null
let userIsPressing = false
/*
Array of:
{
  begin: <time>,
  end: <time>
}
*/
const savedZeiten = window.localStorage.getItem('cubezeiten')
const zeiten = JSON.parse(savedZeiten) || []
// We did not draw the entire list in the beginning, so as soon as we started
// saving our times we were loading them but not drawing them. On the stop event 
// we _only_ add a new time. So we make sure we draw everything at least once
// Bugfix by Thomas
drawZeitleiste()
let bestTime = calcBestTiming()

document.getElementById('timerbox').addEventListener('mousedown', (e) => {
  lastMouseDownTime = Date.now()
  if (timerRunning()) {
    // stop
    timerStop = Date.now()
    // We need to make sure that the timer displays the actual time that we are saving.
    // Normal updates to the timer are drawn in 10ms intervals and it is possible that
    // we click just as the timer turns to 17 hundreds, but the last value displayed is 16
    // Bugfix by Carla
    drawTimer()
    zeiten.push({
      begin: timerStart,
      end: timerStop
    })
    updateList()
    updateBestTime()
    updateAverageTime()
    saveTimings()
  } else {
    userIsPressing = true
    document.getElementById('timer').style.color = 'red'
  }
})

document.getElementById('timerbox').addEventListener('mouseup', (e) => {
  userIsPressing = false
  document.getElementById('timer').style.color = 'black'
  if (!timerRunning() && lastMouseDownTime) {
    // start
    if (Date.now() - lastMouseDownTime > 1 * 1000) {
      timerStart = Date.now()
      timerStop = null  
    }
  } 
})


function timerRunning() {
  return timerStart && !timerStop
}

function updateTimer() {
  if (userIsPressing && Date.now() - lastMouseDownTime > 1 * 1000) {
    document.getElementById('timer').style.color = 'green'
  }
  if (timerRunning()) {    
    drawTimer()
  }
  window.requestAnimationFrame(updateTimer)
}

function drawTimer() {
  document.getElementById('timer').textContent = formatTime(Date.now() - timerStart)
}

function formatTime(timerTimeInMs) {
  const minutes = Math.trunc(timerTimeInMs / 1000 / 60)
  const seconds = Math.trunc((timerTimeInMs / 1000) - (minutes * 60))
  const hundreds = Math.trunc((timerTimeInMs / 10) - (minutes * 60 * 100) - (seconds * 100))
  return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}.${hundreds < 10 ? '0' : ''}${hundreds}`
}

function updateList() {
  if (zeiten.length > 0) {
    const lastTiming = zeiten[zeiten.length - 1]
    addToZeitleiste(lastTiming, true)
  }
}

function drawZeitleiste() {
  for (let i = 0; i < zeiten.length; i++) {
    addToZeitleiste(zeiten[i], i == zeiten.length - 1 ? true : false)
  }
}

function addToZeitleiste(timing, scrollIntoView) {
  const zeitleiste = document.getElementById('zeitleiste')
  const neueZeit = document.createElement('li')
  neueZeit.textContent = formatTime(timing.end - timing.begin)
  zeitleiste.appendChild(neueZeit)
  if (scrollIntoView) {
    neueZeit.scrollIntoView()
  }
}

function timingInMs(begin, end) {
  return end - begin
}

function calcBestTiming() {
  if (zeiten.length == 0) {
    return null
  }
  let smallestIndex = 0
  for (let i = 1; i < zeiten.length; i++) {
    if (timingInMs(zeiten[i].begin, zeiten[i].end) < timingInMs(zeiten[smallestIndex].begin, zeiten[smallestIndex].end)) {
      smallestIndex = i
    }
  }
  return zeiten[smallestIndex]
}

function updateBestTime() {
  const newBestTime = calcBestTiming()
  if (newBestTime) {
    if (bestTime && timingInMs(newBestTime.begin, newBestTime.end) < timingInMs(bestTime.begin, bestTime.end)) {
      // TODO: We have a new record! Do something
    }
    bestTime = newBestTime
    document.getElementById('bestzeitzeit').textContent = formatTime(newBestTime.end - newBestTime.begin)
  }
}

function calcAverageTiming() {
  if (zeiten.length == 0) {
    return 0
  }
  let total = 0
  for (let i = 0; i < zeiten.length; i++) {
    total += timingInMs(zeiten[i].begin, zeiten[i].end)
  }
  return total / zeiten.length
}

function updateAverageTime() {
  const newAverageTime = calcAverageTiming()
  document.getElementById('durchschnittszeitzeit').textContent = formatTime(newAverageTime)
}

function saveTimings() {
  window.localStorage.setItem('cubezeiten', JSON.stringify(zeiten))
}

window.requestAnimationFrame(updateTimer)
