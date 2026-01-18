import { auth, db } from './firebase-init.js';

// Pages that don't require login
const PUBLIC_PAGES = ['login.html', 'signup.html', 'index.html', 'unauthorized.html'];

auth.onAuthStateChanged(async (user) => {
    const path = window.location.pathname;
    const page = path.split('/').pop();

    // 1. REDIRECT TO LOGIN if not authenticated on a private page
    if (!user && !PUBLIC_PAGES.includes(page)) {
        // Adjust path based on depth
        const depth = path.split('/').length - 2;
        const prefix = depth === 1 ? '../' : depth === 2 ? '../../' : '';
        window.location.href = prefix + 'public/login.html';
        return;
    }

    // 2. CHECK ROLE & BLOCK STATUS if authenticated
    if (user && !PUBLIC_PAGES.includes(page)) {
        try {
            const doc = await db.collection('users').doc(user.uid).get();
            
            if (!doc.exists) {
                console.warn("User profile missing.");
                await auth.signOut();
                return;
            }

            const data = doc.data();

            // A. Check Block Status
            if (data.isBlocked) {
                alert("Your account has been suspended. Please contact the Administrator.");
                await auth.signOut();
                window.location.href = '../../public/login.html';
                return;
            }

            // B. Role-Based Access Control (RBAC)
            const role = data.role;
            
            if (path.includes('/student/') && role !== 'student') {
                alert("Unauthorized: Student Access Only");
                history.back();
            } 
            else if (path.includes('/teacher/') && role !== 'teacher') {
                alert("Unauthorized: Faculty Access Only");
                history.back();
            }
            else if (path.includes('/hod/') && role !== 'hod') {
                alert("Unauthorized: HOD Access Only");
                history.back();
            }
            else if (path.includes('/lab-assistant/') && role !== 'lab_assistant') {
                alert("Unauthorized: Lab Staff Only");
                history.back();
            }
            else if (path.includes('/admin/') && role !== 'admin') {
                alert("Unauthorized: Admin Only");
                history.back();
            }

        } catch (error) {
            console.error("Route Guard Error:", error);
        }
    }
});