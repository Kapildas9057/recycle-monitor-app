# EcoShift Super Admin Guide

## Overview
This guide covers the Super Admin functionality for the EcoShift Waste Management System.

## Super Admin Access

### Credentials
- **Email**: `kd850539@gmail.com`
- **Password**: `jeyapriya@1985`

### How to Login
1. Navigate to the login page
2. Enter the Super Admin email and password
3. No need to select a role - the system automatically detects Super Admin credentials
4. You will be redirected to the Super Admin Dashboard

## Super Admin Capabilities

### 1. User Management
**Location**: Users Tab

**Features**:
- View all registered users (Admins and Employees)
- Create new users with auto-generated Employee IDs
  - Admins: `ADM###` (e.g., ADM123)
  - Employees: `EMP###` (e.g., EMP456)
- Delete users (Firestore data only - Auth users must be deleted from Firebase Console)
- View user creation dates and roles

**To Create a User**:
1. Click "Create User" button
2. Fill in:
   - Full Name
   - Email Address
   - Password (min. 6 characters)
   - Role (Employee or Admin)
3. Click "Create User"
4. System auto-generates Employee ID

### 2. Waste Data Management
**Location**: Waste Data Tab

**Features**:
- View all waste entries from all employees
- Filter entries by employee ID, name, or waste type
- Approve or reject waste entries
- Export all data to CSV
- Clear all waste data (with confirmation)

**Entry Status**:
- 🟡 Pending (yellow badge)
- 🟢 Approved (green badge)
- 🔴 Rejected (red badge)

### 3. Analytics
**Location**: Analytics Tab

**Features**:
- View comprehensive waste collection analytics
- Charts showing:
  - Daily waste trends
  - Weekly summaries
  - Monthly aggregates
- Leaderboard of top-performing employees
- Total waste collected metrics

### 4. Storage Management
**Location**: Storage Tab

**Features**:
- Browse all uploaded waste images
- View images organized by employee
- Download individual images
- Delete images from Firebase Storage
- View file sizes and upload dates

**Storage Path**: `/waste_images/{employeeId}/{imageId}.jpg`

### 5. Settings
**Location**: Settings Tab

**Features**:
- Update Super Admin email
- Change Super Admin password
- Database export (CSV/Excel) - Coming Soon

## Firestore Security

### Collections Structure
```
users/
  - {userId}
    - email
    - employee_id
    - role
    - created_at

user_profiles/
  - {userId}
    - name
    - employee_id
    - created_at

user_roles/
  - {userId}
    - role
    - created_at

waste_entries/
  - {entryId}
    - employeeId
    - employeeName
    - wasteType
    - amount
    - location
    - status
    - image_url
    - dateTime
    - created_at
```

### Security Rules
The Super Admin has full access defined in `firestore.rules`:
- Super Admin email hardcoded: `kd850539@gmail.com`
- Full read/write/delete on all collections
- Admins: Read all, limited write
- Employees: Write own entries only

### Firestore Indexes
Located in `firestore.indexes.json`:
- `employeeId + created_at` (DESC)
- `employeeId + wasteType` (ASC)
- `created_at + amount` (DESC)
- `status + created_at` (DESC)

## Firebase Storage Security

### Storage Rules
Located in `storage.rules`:

**Waste Images** (`/waste_images/{employeeId}/{imageId}`):
- Employees: Can upload their own images
- Admins & Super Admin: Can view all images
- Super Admin: Can delete any image

## Deployment

### Prerequisites
- Firebase project configured
- Firestore indexes deployed
- Security rules deployed

### Deploy Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

### Deploy Security Rules
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### GitHub Integration
The app is connected to GitHub and deployed on Render:
1. Push changes to GitHub
2. Render automatically deploys
3. Firebase config stays consistent

## Troubleshooting

### "Query requires an index" Error
1. Check `firestore.indexes.json` is deployed
2. Run: `firebase deploy --only firestore:indexes`
3. Wait 5-10 minutes for indexes to build

### Can't Delete Users
- Firebase Auth users must be deleted from Firebase Console
- Super Admin can only delete Firestore data
- Navigate to Firebase Console → Authentication → Users

### Storage Upload Fails
1. Check `storage.rules` are deployed
2. Verify employee has correct `employee_id`
3. Check browser console for detailed errors

### Real-time Updates Not Working
1. Ensure Firestore rules allow real-time listeners
2. Check browser network tab for WebSocket connections
3. Verify user authentication status

## Best Practices

### User Management
- Regularly audit user list
- Remove inactive users
- Use strong passwords (min. 8 characters recommended)
- Keep employee IDs organized

### Data Management
- Export data regularly for backups
- Review and approve entries promptly
- Monitor storage usage (Firebase free tier: 5GB)

### Security
- Never share Super Admin credentials
- Regularly update password
- Monitor user activity
- Review Firestore security rules periodically

## Technical Notes

### Custom Claims
While Firebase Custom Claims are mentioned in the requirements, the current implementation uses:
- Email-based Super Admin detection
- Firestore-based role management
- Security rules for access control

To implement Custom Claims (requires Firebase Admin SDK):
1. Set up Cloud Functions
2. Implement `setCustomUserClaims()`
3. Update security rules to use `request.auth.token.role`

### Performance Optimization
- Firestore indexes handle complex queries
- IndexedDB caching for offline support
- Service Worker for asset caching
- Lazy loading for dashboard tabs

## Support

For issues or questions:
1. Check browser console for errors
2. Review Firestore rules in Firebase Console
3. Verify indexes are deployed
4. Check network tab for API failures

---

**Version**: 1.0  
**Last Updated**: 2025-11-02  
**Maintained By**: Super Admin (kd850539@gmail.com)
