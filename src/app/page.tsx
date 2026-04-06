import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-900">
        <span className="text-lg font-bold">World Music</span>
        <Link href="/gallery" className="text-sm text-gray-400 hover:text-white transition-colors">내 갤러리</Link>
      </nav>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-xl">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            노래의 세계에<br /><span className="text-purple-400">머물다</span>
          </h1>
          <p className="text-lg text-gray-400 mb-8 leading-relaxed">
            노래를 듣는 동안 당신은 잠시 그 세계의 주민이 됩니다.<br />
            편지를 쓰면, AI가 당신만의 세계를 만들어줍니다.
          </p>
          <Link href="/create" className="inline-block px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-lg font-medium transition-colors">세계 만들기</Link>
        </div>
      </main>
      <footer className="text-center py-4 text-xs text-gray-700">같은 노래, 다른 세계. 그 다름을 존중합니다.</footer>
    </div>
  );
}
