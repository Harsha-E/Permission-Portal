import { db } from './firebase-init.js';

document.getElementById('csv-upload').addEventListener('change', handleFileUpload);

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
        const text = e.target.result;
        const rows = text.split('\n').slice(1); // Skip header row

        let successCount = 0;
        let failCount = 0;
        const logArea = document.getElementById('upload-logs');
        logArea.innerText = "Starting upload process...\n";

        for (const row of rows) {
            if (!row.trim()) continue; // Skip empty rows

            // Expected CSV Format: Name, Email, ID/RollNo, Department, Role
            const columns = row.split(',').map(c => c.trim());
            
            if (columns.length < 2) continue; // Basic validation

            const [name, email, idRaw, deptRaw, roleRaw] = columns;
            
            if (!email || !name) {
                logArea.innerText += `⚠️ Skipped Invalid Row: ${row}\n`;
                continue;
            }

            // Normalization
            const safeName = name;
            const safeEmail = email.toLowerCase();
            const role = roleRaw ? roleRaw.toLowerCase() : 'student';
            const department = deptRaw ? deptRaw.toUpperCase() : 'General';
            
            try {
                // --- GOLDEN SCHEMA CONSTRUCTION ---
                let userData = {
                    displayName: safeName,
                    email: safeEmail,
                    role: role,
                    department: department,
                    attendance: 75,
                    isBlocked: false,
                    createdAt: new Date().toISOString()
                };

                // ID Logic & Field Filling
                let docId = safeEmail; // Default ID is email

                if (role === 'student') {
                    const rollNo = idRaw ? idRaw.toUpperCase() : "UNKNOWN";
                    docId = rollNo; // Students use Roll No as ID for easy lookup
                    
                    userData.rollNumber = rollNo;
                    userData.section = "A"; // Default
                    userData.year = "2";    // Default
                } else {
                    // STAFF LOGIC
                    docId = safeEmail; // Staff use Email as ID
                    
                    if (role === 'teacher') {
                        userData.rollNumber = "Staff";
                        userData.section = "Faculty";
                        userData.year = "4";
                    } else if (role === 'hod') {
                        userData.rollNumber = "HOD";
                        userData.section = "Head";
                        userData.year = "5";
                    } else if (role === 'lab_assistant') {
                        userData.rollNumber = "LAB";
                        userData.section = "Labs";
                        userData.year = "4";
                    } else {
                        userData.rollNumber = "Admin";
                        userData.section = "IT";
                        userData.year = "6";
                    }
                }

                // Write to Firestore
                // Note: Using set() with merge:true so we don't overwrite if exists, but update schema
                await db.collection('users').doc(docId).set(userData, { merge: true });

                successCount++;
                logArea.innerText += `✅ Uploaded: ${safeName} (${role})\n`;
                
            } catch (err) {
                failCount++;
                console.error(err);
                logArea.innerText += `❌ Failed: ${safeEmail} - ${err.message}\n`;
            }
        }
        
        alert(`Bulk Upload Complete.\nSuccess: ${successCount}\nFailed: ${failCount}`);
    };

    reader.readAsText(file);
}