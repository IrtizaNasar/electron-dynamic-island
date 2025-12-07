const { app, screen } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(() => {
    const display = screen.getPrimaryDisplay();
    const info = {
        bounds: display.bounds,
        workArea: display.workArea,
        scaleFactor: display.scaleFactor
    };

    console.log('Display Info:', info);
    fs.writeFileSync(path.join(__dirname, 'notch-info.json'), JSON.stringify(info, null, 2));

    app.quit();
});
