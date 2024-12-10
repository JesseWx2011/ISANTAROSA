// Service Worker (service-worker.js)
self.addEventListener('push', event => {
  const data = event.data.json();
  const notification = new Notification(data.title, {
      body: data.body,
      icon: './weatheralert.png'
  });
});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
          console.log('Service Worker registered:', registration);
      })
      .catch(error => {
          console.error('Service Worker registration failed:', error);
      });
}

// Main JavaScript File (script.js)
const apiUrl = "https://api.weather.gov/alerts/active?status=actual&event=Tornado Warning,Severe Thunderstorm Warning,Flash Flood Warning,Civil Danger Warning,Civil Emergency Message,Law Enforcement Warning,Nuclear Power Plant Warning,Evacuation Immediate,Hurricane Warning,Tropical Storm Warning,Extreme Wind Warning,Storm Surge Warning,Severe Weather Statement&zone=FLZ204,FLZ203&limit=500";

async function fetchAlerts() {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    const alerts = data.features;

    const alertList = document.getElementById("alert-list");
    alertList.innerHTML = "";

    // Check for new or updated alerts
    const newAlerts = alerts.filter(alert => !seenAlerts.has(alert.id));
    const updatedAlerts = alerts.filter(alert => seenAlerts.has(alert.id) && alert.properties.sent !== seenAlerts.get(alert.id));

    // Send notifications for new and updated alerts
    newAlerts.forEach(alert => {
      sendNotification(alert);
      seenAlerts.set(alert.id, alert.properties.sent);
    });
    updatedAlerts.forEach(alert => {
      sendNotification(alert);
      seenAlerts.set(alert.id, alert.properties.sent);
    });

    // Display alerts in the HTML list
    alerts.forEach(alert => {
      const li = document.createElement("li");
      li.innerHTML = `
        <h3>${alert.properties.headline}</h3>
        <p><strong>Type:</strong> ${alert.properties.event}</p>
        <p><strong>Location:</strong> ${alert.properties.areaDescription}</p>
        <p>${alert.properties.description}</p>
      `;
      alertList.appendChild(li);  
      const alertSound = document.getElementById('alertSound');
alertSound.play();

    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
  }
}

// Function to send a browser notification
function sendNotification(alert) {
  if (Notification.permission === 'granted') {
    const notification = new Notification(alert.properties.headline, {
      body: alert.properties.description,
      icon: 'alert_icon.png' // Replace with your icon path
    });

    notification.onclick = () => {
      // Handle notification click, e.g., open a specific page
      window.open(alert.properties.url);
    };
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        sendNotification(alert);
      }
    });
  }
}

// Keep track of seen alerts and their sent timestamps
const seenAlerts = new Map();

// Register the Service Worker
navigator.serviceWorker.register('service-worker.js').then(registration => {
  // Send a push notification using the Service Worker
  registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'BPpKYBSI5hnXDo_5VQXs_44BgczSLvojY7SSBH_YCekBTriEAk5nP8ivyFtLUiBpfy8DGIotnIpW6cF_jW9YqBM' // Replace with your VAPID key
  }).then(subscription => {
    // Send the subscription endpoint to your server
    // to send push notifications
  });
});

// Initial fetch and subsequent updates every minute
fetchAlerts();
setInterval(fetchAlerts, 60000);
