chrome.storage.local.get(
  ["websites", "tabSwitches"],
  (data) => {

    let html = "";

    html += `<h3>Tab Switches: ${data.tabSwitches || 0}</h3>`;

    const websites = data.websites || {};

    for (const site in websites) {

      const minutes =
        (websites[site] / 1000 / 60).toFixed(1);

      html += `
        <div class="website">
          ${site}<br>
          ${minutes} min
        </div>
      `;
    }

    document.getElementById("stats").innerHTML = html;
  }
);