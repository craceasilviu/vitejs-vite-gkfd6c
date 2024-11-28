import { writable } from 'svelte/store';
import { setupRealtimeListener } from './firestore';
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  doc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { addMonths, isBefore, parseISO, format, differenceInDays, isValid } from 'date-fns';
import { showSuccess, showError, showInfo } from '../lib/toast';

export const ALERT_TYPE = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
};

export const ALERT_STATUS = {
  NEW: 'new',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved'
};

// Local store
export const alerts = writable([]);
export const loading = writable(false);
export const error = writable(null);

// Initialize alerts from Firestore with real-time updates
export async function initializeAlerts() {
  try {
    loading.set(true);
    // Setup real-time listener
    setupRealtimeListener('alerts', alerts);
    return true;
  } catch (err) {
    console.error('Failed to initialize alerts:', err);
    error.set(err.message);
    return false;
  } finally {
    loading.set(false);
  }
}

// Add alert to Firestore
export async function addAlert(alertData) {
  try {
    loading.set(true);
    error.set(null);

    const data = {
      ...alertData,
      timestamp: new Date().toISOString(),
      status: ALERT_STATUS.NEW
    };

    const docRef = await addDoc(collection(db, 'alerts'), data);
    return { id: docRef.id, ...data };
  } catch (err) {
    console.error('Error adding alert:', err);
    error.set(err.message);
    return null;
  } finally {
    loading.set(false);
  }
}

// Update alert status in Firestore
export async function updateAlertStatus(id, newStatus) {
  try {
    loading.set(true);
    error.set(null);

    const alertRef = doc(db, 'alerts', id);
    await updateDoc(alertRef, {
      status: newStatus,
      lastModified: new Date().toISOString()
    });

    showSuccess(`Alert ${newStatus.toLowerCase()} successfully`);
    return true;
  } catch (err) {
    console.error('Error updating alert:', err);
    error.set(err.message);
    showError(err.message || 'Failed to update alert status');
    return false;
  } finally {
    loading.set(false);
  }
}

// Delete alert from Firestore
export async function deleteAlert(id) {
  try {
    loading.set(true);
    error.set(null);

    await deleteDoc(doc(db, 'alerts', id));
    showSuccess('Alert deleted successfully');
    return true;
  } catch (err) {
    console.error('Error deleting alert:', err);
    error.set(err.message);
    showError(err.message || 'Failed to delete alert');
    return false;
  } finally {
    loading.set(false);
  }
}

// Check certificate expiration and create alerts
export async function checkCertificateExpiration(user) {
  if (!user?.id) {
    console.error('Invalid user data:', user);
    return 0;
  }

  if (!user?.certifications || user.role !== 'producer') {
    return 0;
  }

  let alertsCreated = 0;
  const today = new Date();

  try {
    // Check each certificate type
    const certTypes = ['globalGap', 'grasp', 'eco'];
    
    for (const certType of certTypes) {
      const cert = user.certifications[certType];
      
      // Skip if certificate doesn't exist or has invalid date
      if (!cert?.validUntil || !isValid(parseISO(cert.validUntil))) {
        continue;
      }

      const expiryDate = parseISO(cert.validUntil);
      const daysUntilExpiry = differenceInDays(expiryDate, today);
      
      // Check if certificate is expired or expires within 30 days
      if (daysUntilExpiry <= 30) {
        try {
          // Check if we already have an active alert for this certificate
          const existingAlerts = await getDocs(
            query(
              collection(db, 'alerts'),
              where('userId', '==', user.id),
              where('certificationType', '==', certType),
              where('status', 'in', [ALERT_STATUS.NEW, ALERT_STATUS.ACKNOWLEDGED])
            )
          );

          if (existingAlerts.empty) {
            const alertData = {
              type: ALERT_TYPE.WARNING,
              title: `${certType.toUpperCase()} Certificate ${daysUntilExpiry < 0 ? 'Expired' : 'Expiring Soon'}`,
              message: `${user.companyName}'s ${certType.toUpperCase()} certificate ${cert.number ? `(${cert.number})` : ''} ${
                daysUntilExpiry < 0 
                  ? `expired ${Math.abs(daysUntilExpiry)} days ago`
                  : `will expire in ${daysUntilExpiry} days`
              } on ${format(expiryDate, 'MMMM d, yyyy')}`,
              userId: user.id,
              certificationType: certType,
              expiryDate: cert.validUntil,
              status: ALERT_STATUS.NEW
            };

            const result = await addAlert(alertData);
            if (result) alertsCreated++;
          }
        } catch (err) {
          console.error(`Error checking ${certType} certificate for ${user.companyName}:`, err);
          // Continue checking other certificates even if one fails
        }
      }
    }

    return alertsCreated;
  } catch (err) {
    console.error(`Error checking certificates for ${user.companyName}:`, err);
    throw new Error(`Failed to check certificates for ${user.companyName}: ${err.message}`);
  }
}

// Check all certificates
export async function checkAllCertificates(users) {
  if (!Array.isArray(users)) {
    showError('Invalid users data provided');
    return 0;
  }

  const producers = users.filter(u => u.role === 'producer');
  if (producers.length === 0) {
    showInfo('No producers found to check certificates');
    return 0;
  }

  let totalAlertsCreated = 0;
  let errors = [];

  for (const producer of producers) {
    try {
      const alertsCreated = await checkCertificateExpiration(producer);
      totalAlertsCreated += alertsCreated;
    } catch (err) {
      console.error(`Error checking certificates for producer ${producer.companyName}:`, err);
      errors.push(`${producer.companyName}: ${err.message}`);
    }
  }

  if (errors.length > 0) {
    showError(`Errors occurred while checking certificates:\n${errors.join('\n')}`);
  } else if (totalAlertsCreated > 0) {
    showSuccess(`Created ${totalAlertsCreated} new alert${totalAlertsCreated === 1 ? '' : 's'} for expiring certificates`);
  } else {
    showInfo('No new expiring certificates found');
  }

  return totalAlertsCreated;
}

// Initialize the store
initializeAlerts();