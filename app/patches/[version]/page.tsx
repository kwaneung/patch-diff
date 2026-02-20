import { notFound } from 'next/navigation';
import { getPatches, getPatchData } from '@/lib/data/patches';
import { PatchDetailView } from '@/components/patch-detail-view';

interface PageProps {
  params: Promise<{ version: string }>;
}

export async function generateStaticParams() {
  const patches = await getPatches();
  return patches.slice(0, 10).map((p) => ({ version: p.version }));
}

export default async function Page({ params }: PageProps) {
  const { version } = await params;
  const data = await getPatchData(version);

  if (!data) {
    notFound();
  }

  return <PatchDetailView patch={data.patch} items={data.items} />;
}
