"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mb-4 mt-8">{children}</h2>;
}

export default function AdminUserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Array<{ email: string; uid: string; admin: boolean }>>([]);
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch users
  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(setUsers)
      .catch(() => setError('Failed to load users'));
    fetch('/api/admin/allowed-emails')
      .then(res => res.json())
      .then(setAllowedEmails)
      .catch(() => setError('Failed to load allowed emails'));
  }, []);

  // Promote user to admin
  async function promote(uid: string) {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    });
    if (!res.ok) setError('Failed to promote user');
    else router.refresh();
    setLoading(false);
  }

  // Promote allowed email to admin
  async function promoteByEmail(email: string) {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/allowed-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, admin: true }),
    });
    if (!res.ok) setError('Failed to promote email');
    else router.refresh();
    setLoading(false);
  };

  // Delete user
  async function deleteUser(uid: string) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/users?uid=${encodeURIComponent(uid)}`, {
      method: 'DELETE',
    });
    if (!res.ok) setError('Failed to delete user');
    else router.refresh();
    setLoading(false);
  }

  // Add allowed email
  async function addAllowedEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/allowed-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, admin: false }),
    });
    if (!res.ok) setError('Failed to add email');
    else router.refresh();
    setLoading(false);
    setNewEmail('');
  }

  // Delete allowed email
  async function deleteAllowedEmail(email: string) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/allowed-emails?email=${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
    if (!res.ok) setError('Failed to delete email');
    else router.refresh();
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">User Management</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <SectionTitle>Existing Users</SectionTitle>
      <table className="w-full mb-8 border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Admin</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.uid} className="border-t">
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.admin ? 'Yes' : 'No'}</td>
              <td className="p-2 space-x-2">
                <div className="space-x-2">
                  {!user.admin && (
                    <button className="px-2 py-1 bg-green-600 text-white rounded" disabled={loading} onClick={() => promote(user.uid)}>Promote to Admin</button>
                  )}
                </div>
                <button className="px-2 py-1 bg-red-600 text-white rounded" disabled={loading} onClick={() => deleteUser(user.uid)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <SectionTitle>Allowed Emails (Prospective Users)</SectionTitle>
      <form className="mb-4 flex" onSubmit={addAllowedEmail}>
        <input type="email" className="border p-2 flex-1 rounded-l" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Add email address" required />
        <button type="submit" className="px-4 bg-blue-600 text-white rounded-r" disabled={loading}>Add</button>
      </form>
      <ul className="border rounded divide-y">
        {allowedEmails.map(email => (
          <li key={email} className="flex items-center justify-between p-2">
            <span>{email}</span>
            <div className="space-x-2">
              <button className="px-2 py-1 bg-green-600 text-white rounded" disabled={loading} onClick={() => promoteByEmail(email)}>Promote to Admin</button>
              <button className="px-2 py-1 bg-red-600 text-white rounded" disabled={loading} onClick={() => deleteAllowedEmail(email)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


