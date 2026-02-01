import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon } from 'lucide-react';

interface PatchCardProps {
  patch: {
    id: string;
    version: string;
    title: string | null;
    release_date: string | null;
  };
}

export function PatchCard({ patch }: PatchCardProps) {
  return (
    <Link href={`/patches/${patch.version}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">
            Patch {patch.version}
          </CardTitle>
          <Badge variant="outline">{patch.title || 'Update'}</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground mt-2">
            <CalendarIcon className="mr-1 h-4 w-4" />
            {patch.release_date
              ? new Date(patch.release_date).toLocaleDateString()
              : 'Unknown Date'}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
