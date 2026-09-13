const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  port: 465,
  secure: true,
  auth: {
    user: "copilot@eschure.com",
    pass: "YOUR_PASSWORD_HERE",
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.log("FAILED:", err);
  } else {
    console.log("SUCCESS:", success);
  }
});