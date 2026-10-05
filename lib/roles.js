export const roleLabel = (r) => (r === 'admin' ? 'Admin' : r === 'staff' ? 'Staff' : r ? 'Customer' : '');
export const isStaffRole = (r) => r === 'admin' || r === 'staff';
