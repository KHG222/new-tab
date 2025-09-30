const GREETING_ID = "greeting";

// Fallback default times
let sunriseHour = 6;
let sunriseMinute = 0;
let noonHour = 12;
let noonMinute = 0;
let sunsetHour = 18;
let sunsetMinute = 0;

let currentLabel = null;
let checkInterval = null;

// === Background Handling ===
function changeBackgroundBasedOnCondition(condition) {
  document.body.className = ''; // Remove existing classes
  document.body.classList.add(condition); // Add 'morning', 'afternoon', or 'night'
}

// === Greeting and Background Update ===
function updateLabelAndSave(now) {
  const label = determineTimeOfDay(now);

  if (label !== currentLabel) {
    currentLabel = label;

    // Update greeting text
    const greetingEl = document.getElementById(GREETING_ID);
    if (greetingEl) {
      greetingEl.textContent = label;
    }

    // Update background
    changeBackgroundBasedOnCondition(label.toLowerCase());
  }
}

// === Determine Time of Day ===
function determineTimeOfDay(now) {
  const hour = now.getHours();
  const minute = now.getMinutes();
  const nowMins = hour * 60 + minute;
  const sunriseMins = sunriseHour * 60 + sunriseMinute;
  const noonMins = noonHour * 60 + noonMinute;
  const sunsetMins = sunsetHour * 60 + sunsetMinute;

  if (nowMins >= sunriseMins && nowMins < noonMins) {
    return "Morning";
  } else if (nowMins >= noonMins && nowMins < sunsetMins) {
    return "Afternoon";
  } else {
    return "Night";
  }
}

// === Start Periodic Checking ===
function startChecking() {
  updateLabelAndSave(new Date());

  if (checkInterval) {
    clearInterval(checkInterval);
  }

  checkInterval = setInterval(() => {
    updateLabelAndSave(new Date());
  }, 60 * 1000); // Check every minute
}

// === Fetch Sunrise/Sunset Times and Start ===
function fetchSunriseSunsetAndStart() {
  if (!navigator.geolocation) {
    console.warn("Geolocation not supported, using fallback times.");
    startChecking(); // fallback start immediately
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const response = await fetch(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`);
        const data = await response.json();

        const sunriseUTC = new Date(data.results.sunrise);
        const sunsetUTC = new Date(data.results.sunset);
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const sunriseLocal = new Date(sunriseUTC.toLocaleString("en-US", { timeZone }));
        const sunsetLocal = new Date(sunsetUTC.toLocaleString("en-US", { timeZone }));

        sunriseHour = sunriseLocal.getHours();
        sunriseMinute = sunriseLocal.getMinutes();
        sunsetHour = sunsetLocal.getHours();
        sunsetMinute = sunsetLocal.getMinutes();

        console.log("Sunrise/sunset times set from API.");
      } catch (error) {
        console.warn("API failed, using fallback sunrise/sunset times.", error);
      } finally {
        startChecking(); // always start checking after try/catch
      }
    },
    (error) => {
      console.warn("Geolocation failed, using fallback times.", error);
      startChecking(); // fallback start immediately
    },
    { timeout: 5000 }
  );
}
