import { Maximize2, Mic, MicOff, PhoneOff, SwitchCamera, Video, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "../components/Avatar";
import { useT } from "../i18n";
import { useStore } from "../store";
import { cx } from "../util";

/**
 * Talking to your Muse, face to face.
 *
 * The screen is the agent's own face on the whole canvas — the same avatar the header shows, at
 * full size, breathing while it waits and pulsing while it speaks. Your own camera, when it is on,
 * sits small in the corner the way a call app draws it, so you can see what it sees.
 *
 * It is one round button away in the chat's header, and one press of the red disc to leave;
 * nothing here is a menu. The call itself is the same conversation: what is said is the thread,
 * so the words are still there when the call ends.
 *
 * Video is a switch, not a different screen: with it off this is a voice call and your camera
 * light goes out; with it on the agent can see you. Both send to the model only when it is
 * actually listening, and the switch state is what the runtime is told.
 */
export function CallScreen() {
  const { state, setTab, toast } = useStore();
  const t = useT();
  const name = state.profile?.name ?? "nanoMuse";
  const [video, setVideo] = useState(true); // a video call starts with the camera on
  const [mic, setMic] = useState(true);
  const [seconds, setSeconds] = useState(0);
  // whose picture fills the canvas: the agent's by default, yours after one press of the swap
  const [selfMain, setSelfMain] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // the call timer: it starts when the screen does and stops when it is gone
  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  // the camera: opened only while video is on, and always closed on the way out so the light
  // does not stay on after leaving the call
  useEffect(() => {
    let cancelled = false;
    if (!video) {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      return;
    }
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => undefined);
        }
      })
      .catch(() => {
        // no camera, or the person said no: stay on the voice call and say nothing loud
        setVideo(false);
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    };
  }, [video]);

  const hangUp = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setTab("chat");
    toast(t("Call ended."));
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const speaking = state.status.state === "working";

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#0b0d11] text-white">
      {/* Two people in the call: the agent on its disc, you on your camera. One fills the canvas and
          the other sits in the corner the way a call app draws it; the swap button trades them. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {!selfMain && (
          <div
            className={cx(
              "rounded-full transition-all duration-[1200ms]",
              speaking ? "ring-[10px] ring-white/25" : "ring-0",
            )}
          >
            <Avatar profile={state.profile} status={state.status} size={220} />
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42vh] bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.22),transparent_70%)]" />

      {/* your picture: the canvas itself when you are the main frame, a corner tile otherwise */}
      {video && (
        <video
          ref={videoRef}
          muted
          playsInline
          className={cx(
            selfMain
              ? "absolute inset-0 z-[5] h-full w-full bg-black object-cover"
              : "absolute right-3 top-14 z-20 h-[168px] w-[112px] rounded-2xl border border-white/15 object-cover shadow-lg",
          )}
        />
      )}

      {/* the agent, as a corner tile once you are the main frame */}
      {video && selfMain && (
        <div className="pointer-events-none absolute right-3 top-14 z-20 flex h-[168px] w-[112px] items-center justify-center rounded-2xl border border-white/15 bg-black/55 backdrop-blur">
          <Avatar profile={state.profile} status={state.status} size={72} />
        </div>
      )}

      {/* name and clock */}
      <div className="relative z-10 flex flex-col items-center pt-[max(18px,env(safe-area-inset-top))]">
        <span className="text-[17px] font-semibold">{name}</span>
        <span className="mt-0.5 text-[12.5px] tabular-nums text-white/60">
          {speaking ? t("Speaking…") : t("Connected")} · {mm}:{ss}
        </span>
      </div>

      {/* the controls: mute, video, the red disc, and leave */}
      <div className="relative z-10 mt-auto flex flex-col items-center gap-4 pb-[max(22px,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3.5">
          <CallButton on={!mic} label={mic ? t("Mute") : t("Unmute")} onClick={() => setMic((m) => !m)}>
            {mic ? <Mic size={22} /> : <MicOff size={22} />}
          </CallButton>
          <CallButton on={video} label={video ? t("Turn video off") : t("Turn video on")} onClick={() => setVideo((v) => !v)}>
            {video ? <Video size={22} /> : <VideoOff size={22} />}
          </CallButton>
          <CallButton on={selfMain} label={t("Swap pictures")} onClick={() => setSelfMain((v) => !v)}>
            <SwitchCamera size={22} />
          </CallButton>
          <CallButton label={t("Full screen")} onClick={() => document.documentElement.requestFullscreen?.().catch(() => undefined)}>
            <Maximize2 size={22} />
          </CallButton>
        </div>
        <button
          type="button"
          onClick={hangUp}
          aria-label={t("Hang up")}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white shadow-[0_8px_30px_rgba(244,63,94,0.45)] transition hover:bg-rose-600"
        >
          <PhoneOff size={26} />
        </button>
      </div>
    </div>
  );
}

function CallButton({
  children,
  label,
  onClick,
  on = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  /** lit: the switch is engaged (muted, or video on) */
  on?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={on}
      className={cx(
        "flex h-13 w-13 items-center justify-center rounded-full transition",
        "h-[52px] w-[52px]",
        on ? "bg-white text-[#0b0d11]" : "bg-white/12 text-white hover:bg-white/20",
      )}
    >
      {children}
    </button>
  );
}
