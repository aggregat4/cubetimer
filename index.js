let timerStart = null
let timerStop = Date.now()
/*
Array of:
{
  begin: <time>,
  end: <time>
}
*/
const zeiten = []
let bestTime = calcBestTiming()

document.getElementById('timerbox').addEventListener('click', (e) => {
  if (!timerRunning()) {
    // start
    timerStart = Date.now()
    timerStop = null
  } else {
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
  }
})

function timerRunning() {
  return timerStart && !timerStop
}

function updateTimer() {
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
    const zeitleiste = document.getElementById('zeitleiste')
    const neueZeit = document.createElement('li')
    neueZeit.textContent = formatTime(lastTiming.end - lastTiming.begin)
    zeitleiste.appendChild(neueZeit)
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
    if (timingInMs(newBestTime.begin, newBestTime.end) < timingInMs(bestTime.begin, bestTime.end)) {
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

window.requestAnimationFrame(updateTimer)
