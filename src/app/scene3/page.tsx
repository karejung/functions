import dynamic from 'next/dynamic';

const Scene3 = dynamic(() => import('@/components/test2/Scene3'), {
  ssr: false,
});

export default function Scene3Page() {
  return <Scene3 />;
}

