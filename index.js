let timerStart = null
let timerStop = Date.now()
let lastMouseDownTime = null
let lastZeitleistePointerDown = null
let lastZeitleistePointerDownTarget = null
let userIsPressing = false
/*
Array of:
{
  begin: <time>,
  end: <time>
}
*/
const savedZeiten = window.localStorage.getItem('cubezeiten')
let zeiten = JSON.parse(savedZeiten) || []
// We did not draw the entire list in the beginning, so as soon as we started
// saving our times we were loading them but not drawing them. On the stop event 
// we _only_ add a new time. So we make sure we draw everything at least once
// Bugfix by Thomas
drawZeitleiste()
let bestTime = calcBestTiming()
updateAverageTime()
updateBestTime()
const yoohooAudio = new Audio('yoohooo.mp3')

document.getElementById('timerbox').addEventListener('pointerdown', onMouseDown)
// document.getElementById('timerbox').addEventListener('touchstart', onMouseDown)

function onMouseDown(e) {
  e.preventDefault()
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
}

document.getElementById('timerbox').addEventListener('pointerup', onMouseUp)
// document.getElementById('timerbox').addEventListener('touchend', onMouseUp)

function onMouseUp(e) {
  e.preventDefault()
  userIsPressing = false
  document.getElementById('timer').style.color = 'black'
  if (!timerRunning() && lastMouseDownTime) {
    // start
    if (canTimerStart()) {
      timerStart = Date.now()
      timerStop = null  
    }
  } 
}

document.getElementById('zeitleiste').addEventListener('pointerdown', onPointerDownZeitleiste)
document.getElementById('zeitleiste').addEventListener('pointerup', onPointerUpZeitleiste)

function onPointerDownZeitleiste(e) {
  e.preventDefault()
  lastZeitleistePointerDown = Date.now()
  lastZeitleistePointerDownTarget = e.target
}

function onPointerUpZeitleiste(e) {
  e.preventDefault()
  lastZeitleistePointerDown = null
  lastZeitleistePointerDownTarget = null
}

function timerRunning() {
  return timerStart && !timerStop
}

function updateTimer() {
  if (userIsPressing && canTimerStart()) {
    document.getElementById('timer').style.color = 'green'
  }
  if (timerRunning()) {    
    drawTimer()
  }
  if (lastZeitleistePointerDown && lastZeitleistePointerDownTarget && Date.now() - lastZeitleistePointerDown > 500) {
    const id = lastZeitleistePointerDownTarget.getAttribute('id')
    if (lastZeitleistePointerDownTarget.tagName == 'SPAN'
        // only allow removing timings that are 5 minutes young
        && Date.now() - new Date(parseInt(id)) < (5 * 60 * 1000)
        // don't start editing again when we are already editing
        && ! lastZeitleistePointerDownTarget.parentElement.classList.contains('timingEditMode')) {
      const deleteButton = document.createElement('button')
      deleteButton.classList.add('deleteTiming')
      deleteButton.textContent = '🗑'
      deleteButton.addEventListener('click', onDeleteTiming(id))
      const cancelDeleteButton = document.createElement('button')
      cancelDeleteButton.classList.add('cancelDeleteTiming')
      cancelDeleteButton.textContent = '✓'
      cancelDeleteButton.addEventListener('click', onCancelDeleteTiming(id))
      lastZeitleistePointerDownTarget.parentElement.appendChild(deleteButton)
      lastZeitleistePointerDownTarget.parentElement.appendChild(cancelDeleteButton)
      lastZeitleistePointerDownTarget.parentElement.classList.add('timingEditMode')
    }
    lastZeitleistePointerDown = null
    lastZeitleistePointerDownTarget = null
  }
  window.requestAnimationFrame(updateTimer)
}

function onDeleteTiming(timingId) {
  return function() {
    const timingSpan = document.getElementById(`${timingId}`)
    const timingLi = timingSpan.parentElement
    timingLi.remove()
    zeiten = zeiten.filter(zeit => zeit.begin !== parseInt(timingId))
    updateBestTime()
    updateAverageTime()
    saveTimings()
  } 
}

function onCancelDeleteTiming(timingId) {
  return function() {
    const timingSpan = document.getElementById(`${timingId}`)
    const timingLi = timingSpan.parentElement
    timingLi.querySelectorAll('button').forEach(btn => btn.remove())
    timingLi.classList.remove('timingEditMode')
  }
}

function canTimerStart() {
  return Date.now() - lastMouseDownTime > 1 * 750
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
  const timingContent = document.createElement('span')
  timingContent.setAttribute('id', `${timing.begin}`)
  timingContent.classList.toggle('timingTime')
  timingContent.textContent = formatTime(timing.end - timing.begin)
  neueZeit.appendChild(timingContent)
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
      showSparkles()
      yoohooAudio.play().catch(reason => {
        console.log(`Can't play audio: `, reason)
      })
    }
    bestTime = newBestTime
    document.getElementById('bestzeitzeit').textContent = formatTime(newBestTime.end - newBestTime.begin)
  } else {
    document.getElementById('bestzeitzeit').textContent = '-'
  }
}

function showSparkles() {
  const sparkles = document.getElementById('sparkles')
  sparkles.innerHTML = '🤩'
  sparkles.classList.toggle('explode')
  setTimeout(() => {
    sparkles.innerHTML = ''
    sparkles.classList.toggle('explode')
  }, 5000)
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
