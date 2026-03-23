const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 25,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "e2530a67019cc2",
        pass: "b9245eba0a651a",
    },
});

module.exports = {
    sendMail: async function (to, url) {
        const info = await transporter.sendMail({
            from: 'admin@heha.com',
            to: to,
            subject: "Reset Password email",
            text: "click vao day de reset password", // Plain-text version of the message
            html: "click vao <a href=" + url + ">day</a> de reset password", // HTML version of the message
        });
    },
    sendPasswordMail: async function (to, username, password) {
        const info = await transporter.sendMail({
            from: 'admin@heha.com',
            to: to,
            subject: "Your Account Password",
            text: `Xin chao ${username}, mat khau cua ban la: ${password}`,
            html: `<h2>Xin chao ${username}</h2>
                   <p>Tai khoan cua ban da duoc tao thanh cong.</p>
                   <p><b>Username:</b> ${username}</p>
                   <p><b>Password:</b> ${password}</p>
                   <p>Vui long doi mat khau sau khi dang nhap.</p>`,
        });
        return info;
    }
}