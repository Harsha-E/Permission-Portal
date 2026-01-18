/**
 * DISCIPLINARY & BLOCKING MODULE
 * Handles reporting students, escalating to HOD, and Auto-Blocking.
 */
import { db, auth } from './firebase-init.js';
import { 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

export async function reportStudent(studentId, reason, severity) {
    const reporter = auth.currentUser;
    if (!reporter) throw new Error("Must be logged in");

    // 1. Create Disciplinary Record
    const reportRef = await addDoc(collection(db, 'disciplinary_reports'), {
        studentId: studentId,
        reporterId: reporter.uid,
        reason: reason,
        severity: severity, // 'WARNING', 'SEVERE'
        status: severity === 'SEVERE' ? 'PENDING_HOD' : 'WARNING_ISSUED',
        timestamp: serverTimestamp()
    });

    // 2. Immediate Action based on Severity
    if (severity === 'WARNING') {
        // Just flag the student in UI (Yellow Color)
        await updateDoc(doc(db, 'users', studentId), {
            disciplinaryStatus: 'WARNING',
            lastWarning: reason
        });
        return "Warning Issued. Student flagged in system.";
    } 
    else if (severity === 'SEVERE') {
        // Escalate to HOD - Do NOT block yet
        // HOD will see this in their 'Escalated' tab
        return "Report Escalated to HOD for Blocking Approval.";
    }
}

export async function executeBlock(studentId, reportId) {
    // Only HOD/Admin can call this
    await updateDoc(doc(db, 'users', studentId), {
        isBlocked: true,
        disciplinaryStatus: 'BLOCKED',
        blockedAt: serverTimestamp()
    });

    await updateDoc(doc(db, 'disciplinary_reports', reportId), {
        status: 'ACTION_TAKEN',
        action: 'BLOCKED'
    });
}