const fs = require('fs');
const path = require('path');
const https = require('https');

const qrDir = path.join(__dirname, 'qr-codes');
const tableCount = 10;
const appBaseUrl = 'http://localhost:3000'; // Change this to your public URL when deploying

// Create qr-codes directory if it doesn't exist
if (!fs.existsSync(qrDir)) {
  fs.mkdirSync(qrDir, { recursive: true });
  console.log(`Created directory: ${qrDir}`);
}

const downloadQrCode = (tableNumber) => {
  return new Promise((resolve, reject) => {
    const url = `${appBaseUrl}/?table=${tableNumber}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    const filePath = path.join(qrDir, `mesa-${tableNumber}.jpg`);

    https
      .get(qrUrl, (response) => {
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✓ Generated: ${filePath}`);
          resolve();
        });

        fileStream.on('error', (err) => {
          fs.unlink(filePath, () => {});
          reject(err);
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

(async () => {
  console.log('Generating QR codes for tables 1-10...\n');

  for (let i = 1; i <= tableCount; i += 1) {
    try {
      await downloadQrCode(i);
    } catch (error) {
      console.error(`✗ Error generating QR code for table ${i}:`, error.message);
    }
  }

  console.log('\n✓ All QR codes generated successfully!');
  console.log(`Files saved to: ${qrDir}`);
})();
