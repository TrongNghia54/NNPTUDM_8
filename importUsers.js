const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const crypto = require('crypto');
const userModel = require('./schemas/users');
const roleModel = require('./schemas/roles');
const { sendPasswordMail } = require('./utils/mailHandler');

// Tao password ngau nhien dai 16 ky tu
function generatePassword(length = 16) {
    return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

// Delay helper de tranh rate limit Mailtrap
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function importUsers() {
    // Ket noi database
    await mongoose.connect('mongodb://localhost:27017/NNPTUD-S2');
    console.log('Da ket noi MongoDB');

    // Tim role mac dinh (USER), neu chua co thi tao moi
    let defaultRole = await roleModel.findOne({ name: 'USER', isDeleted: false });
    if (!defaultRole) {
        defaultRole = new roleModel({ name: 'USER', description: 'Default user role' });
        await defaultRole.save();
        console.log('Da tao role USER mac dinh');
    }

    // Doc file Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('./user.xlsx');
    const worksheet = workbook.getWorksheet(1);

    const users = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Bo qua dong header
        const usernameCell = row.getCell(1).value;
        const emailCell = row.getCell(2).value;
        // Xu ly truong hop cell la cong thuc Excel (object co .result)
        const username = (typeof usernameCell === 'object' && usernameCell !== null) ? usernameCell.result : usernameCell;
        const email = (typeof emailCell === 'object' && emailCell !== null) ? emailCell.result : emailCell;
        if (username && email) {
            users.push({ username: String(username).trim(), email: String(email).trim() });
        }
    });

    console.log(`Tim thay ${users.length} user trong file Excel`);

    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
        try {
            const password = generatePassword(16);

            const newUser = new userModel({
                username: user.username,
                password: password,
                email: user.email,
                role: defaultRole._id,
                status: false
            });
            await newUser.save();

            // Gui email password cho user
            try {
                await sendPasswordMail(user.email, user.username, password);
            } catch (mailErr) {
                console.log(`  (Email loi: ${mailErr.message})`);
            }

            console.log(`OK: ${user.username} - ${user.email} - password: ${password}`);
            successCount++;

            // Cho 2 giay de tranh rate limit Mailtrap
            await delay(2000);
        } catch (err) {
            console.log(`FAIL: ${user.username} - ${err.message}`);
            failCount++;
        }
    }

    console.log(`\nHoan tat! Thanh cong: ${successCount}, That bai: ${failCount}`);
    await mongoose.disconnect();
}

importUsers().catch(err => {
    console.error('Loi:', err.message);
    mongoose.disconnect();
});
