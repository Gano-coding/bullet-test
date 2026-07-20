import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import QRCode from "qrcode";
import {
  CHARACTER_INFO,
  CHARACTER_IMAGES,
  CHARACTER_SHORT_LABELS,
  getShareUrl,
  type CharacterType,
} from "@/types";
import { PosterCard, PROMO_CHARACTER_IDS } from "@/components/PosterCard";
import { capturePosterPngDataUrl, downloadBlob } from "@/lib/posterCeremony";

export const Route = createFileRoute("/promo-posters")({
  component: PromoPostersPage,
});

const PROMO_PCT = 33;

declare global {
  interface Window {
    __promoExports?: Array<{ name: string; dataUrl: string }>;
    __promoExportDone?: boolean;
    __promoExportError?: string;
  }
}

function PromoPostersPage() {
  const [qrUrl, setQrUrl] = useState("");
  const [status, setStatus] = useState("准备中…");
  const [done, setDone] = useState(0);
  const [running, setRunning] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    QRCode.toDataURL(getShareUrl(), {
      width: 240,
      margin: 1,
      color: { dark: "#0D0A06", light: "#E8D48B" },
      errorCorrectionLevel: "M",
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, []);

  const exportAll = async () => {
    if (running) return;
    setRunning(true);
    setDone(0);
    window.__promoExports = [];
    window.__promoExportDone = false;
    window.__promoExportError = undefined;
    setStatus("开始导出…");

    await new Promise((r) => setTimeout(r, 800));
    await document.fonts?.ready.catch(() => undefined);

    for (let i = 0; i < PROMO_CHARACTER_IDS.length; i++) {
      const id = PROMO_CHARACTER_IDS[i] as CharacterType;
      const info = CHARACTER_INFO[id];
      const node = cardRefs.current[id];
      if (!node) {
        setStatus(`跳过 ${info.name}（节点缺失）`);
        continue;
      }
      setStatus(`正在导出 ${info.name}（${i + 1}/${PROMO_CHARACTER_IDS.length}）…`);
      node.scrollIntoView({ block: "center" });
      await new Promise((r) => setTimeout(r, 250));
      try {
        const dataUrl = await capturePosterPngDataUrl(node);
        window.__promoExports.push({ name: info.name, dataUrl });
        const res = await fetch(dataUrl);
        downloadBlob(await res.blob(), `鹅城签-${info.name}.png`);
        setDone(i + 1);
      } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : Object.prototype.toString.call(err);
        window.__promoExportError = `${info.name}: ${msg}`;
        setStatus(`失败：${info.name} — ${msg}，继续下一张…`);
        // 单张失败不中断整批
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    window.__promoExportDone = true;
    setStatus(`完成：已导出 ${PROMO_CHARACTER_IDS.length} 张主要角色海报`);
    setRunning(false);
  };

  useEffect(() => {
    if (!qrUrl) return;
    const t = window.setTimeout(() => {
      void exportAll();
    }, 1200);
    return () => window.clearTimeout(t);
    // 仅首次二维码就绪后自动跑一轮
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrUrl]);

  return (
    <div className="promo-posters-page">
      <header className="promo-posters-bar">
        <div>
          <h1>宣发海报批量导出</h1>
          <p>{status}</p>
          <p className="promo-posters-progress">
            {done}/{PROMO_CHARACTER_IDS.length}
          </p>
        </div>
        <button type="button" className="btn-solid" disabled={running || !qrUrl} onClick={() => void exportAll()}>
          {running ? "导出中…" : "重新导出全部"}
        </button>
      </header>

      <div className="promo-posters-grid">
        {PROMO_CHARACTER_IDS.map((id) => {
          const c = id as CharacterType;
          const info = CHARACTER_INFO[c];
          return (
            <div key={id} className="promo-posters-item">
              <p className="promo-posters-label">{info.name}</p>
              <div className="poster-stage promo-posters-stage">
                <PosterCard
                  cardRef={(el) => {
                    cardRefs.current[id] = el;
                  }}
                  name={info.name}
                  persona={CHARACTER_SHORT_LABELS[c]}
                  percentage={PROMO_PCT}
                  imageUrl={CHARACTER_IMAGES[c]}
                  verdict={info.verdict}
                  survivalGuide={info.survivalGuide}
                  metaphysics={info.metaphysics}
                  mbti={info.mbti}
                  qrUrl={qrUrl}
                  final
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
