import { useEffect, useState } from 'react';
import { listenTeam, updateUserRole } from '@/lib/firestoreService';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import type { AppUser } from '@/types';

export function TeamManager() {
  const [team, setTeam] = useState<AppUser[]>([]);
  const { appUser } = useAuth();

  useEffect(() => listenTeam(setTeam), []);

  return (
    <Card className="p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-base-400">Team Members</p>
      <div className="flex flex-col divide-y divide-base-700/60">
        {team.map((member) => (
          <div key={member.uid} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-base-700 text-sm font-semibold text-base-100">
                {member.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-base-100">{member.name}</p>
                <p className="text-xs text-base-400">{member.email}</p>
              </div>
            </div>
            <select
              value={member.role}
              disabled={member.uid === appUser?.uid}
              onChange={(e) => void updateUserRole(member.uid, e.target.value as AppUser['role'])}
              className="h-9 rounded-lg border border-base-600 bg-base-900/60 px-2 text-xs text-base-200 outline-none focus:border-accent-500 disabled:opacity-50"
            >
              <option value="admin">Admin</option>
              <option value="member">Team Member</option>
            </select>
          </div>
        ))}
      </div>
    </Card>
  );
}
