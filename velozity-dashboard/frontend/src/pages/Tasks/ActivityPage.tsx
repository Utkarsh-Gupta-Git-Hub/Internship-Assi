import React from 'react';
import AppLayout from '../../components/Layout/AppLayout';
import ActivityFeed from '../../components/ActivityFeed/ActivityFeed';
import { Activity } from 'lucide-react';

export default function ActivityPage() {
  return (
    <AppLayout title="Activity Feed">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div>
          <h2 className="page-title">Live Activity Feed</h2>
          <p className="text-muted">
            Real-time updates across your projects — filtered to your access scope
          </p>
        </div>
        <ActivityFeed />
      </div>
    </AppLayout>
  );
}
