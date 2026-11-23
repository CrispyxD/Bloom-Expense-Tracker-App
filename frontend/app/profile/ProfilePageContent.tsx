"use client";

import Image from "next/image";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent,
} from "react";
import { toast } from "sonner";
import { Icon, useDashboard } from "../components/DashboardApp";

const CROP_SIZE = 240;

type CropImage = {
  url: string;
  width: number;
  height: number;
};

type CropPosition = {
  x: number;
  y: number;
};

type CropDrag = {
  pointerId: number;
  startX: number;
  startY: number;
  position: CropPosition;
};

function clampCropPosition(
  position: CropPosition,
  imageWidth: number,
  imageHeight: number,
): CropPosition {
  return {
    x: Math.max(CROP_SIZE - imageWidth, Math.min(0, position.x)),
    y: Math.max(CROP_SIZE - imageHeight, Math.min(0, position.y)),
  };
}

export default function ProfilePage() {
  const {
    profile,
    setProfile,
    currencyOptions,
    saveProfile,
    initials,
    theme,
    toggleTheme,
    logout,
  } = useDashboard();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const cropDragRef = useRef<CropDrag | null>(null);
  const [cropImage, setCropImage] = useState<CropImage | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPosition, setCropPosition] = useState<CropPosition>({ x: 0, y: 0 });
  const [savingCrop, setSavingCrop] = useState(false);

  useEffect(() => {
    const imageUrl = cropImage?.url;
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [cropImage?.url]);

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Choose an image smaller than 5 MB.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    try {
      const image = new window.Image();
      image.src = imageUrl;
      await image.decode();

      const scale = Math.max(
        CROP_SIZE / image.width,
        CROP_SIZE / image.height,
      );
      setCropPosition({
        x: (CROP_SIZE - image.width * scale) / 2,
        y: (CROP_SIZE - image.height * scale) / 2,
      });
      setCropZoom(1);
      setCropImage({ url: imageUrl, width: image.width, height: image.height });
    } catch (error) {
      URL.revokeObjectURL(imageUrl);
      toast.error(
        error instanceof Error ? error.message : "Could not read this image.",
      );
    }
  }

  function moveCrop(event: PointerEvent<HTMLDivElement>) {
    const drag = cropDragRef.current;
    if (!cropImage || !drag || drag.pointerId !== event.pointerId) return;

    const scale =
      Math.max(CROP_SIZE / cropImage.width, CROP_SIZE / cropImage.height) *
      cropZoom;
    setCropPosition(
      clampCropPosition(
        {
          x: drag.position.x + event.clientX - drag.startX,
          y: drag.position.y + event.clientY - drag.startY,
        },
        cropImage.width * scale,
        cropImage.height * scale,
      ),
    );
  }

  function changeCropZoom(value: number) {
    if (!cropImage) return;
    const baseScale = Math.max(
      CROP_SIZE / cropImage.width,
      CROP_SIZE / cropImage.height,
    );
    const previousScale = baseScale * cropZoom;
    const nextScale = baseScale * value;
    const nextWidth = cropImage.width * nextScale;
    const nextHeight = cropImage.height * nextScale;
    setCropPosition(
      clampCropPosition(
        {
          x:
            CROP_SIZE / 2 -
            ((CROP_SIZE / 2 - cropPosition.x) / previousScale) * nextScale,
          y:
            CROP_SIZE / 2 -
            ((CROP_SIZE / 2 - cropPosition.y) / previousScale) * nextScale,
        },
        nextWidth,
        nextHeight,
      ),
    );
    setCropZoom(value);
  }

  async function saveCroppedAvatar() {
    if (!cropImage) return;
    setSavingCrop(true);
    try {
      const image = new window.Image();
      image.src = cropImage.url;
      await image.decode();

      const baseScale = Math.max(
        CROP_SIZE / cropImage.width,
        CROP_SIZE / cropImage.height,
      );
      const scale = baseScale * cropZoom;
      const sourceSize = CROP_SIZE / scale;
      const sourceX = -cropPosition.x / scale;
      const sourceY = -cropPosition.y / scale;
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Image editing is not supported in this browser.");
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      for (const quality of [0.82, 0.68, 0.54, 0.4]) {
        const avatar = canvas.toDataURL("image/jpeg", quality);
        if (avatar.length <= 24_000) {
          setProfile((currentProfile) => ({ ...currentProfile, avatar }));
          setCropImage(null);
          toast.success("Picture updated. Save changes to keep it.");
          return;
        }
      }

      toast.error("This image could not be compressed enough. Try another image.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not crop this image.",
      );
    } finally {
      setSavingCrop(false);
    }
  }

  const cropScale = cropImage
    ? Math.max(CROP_SIZE / cropImage.width, CROP_SIZE / cropImage.height) *
      cropZoom
    : 1;
  const cropImageStyle = cropImage
    ? {
        left: cropPosition.x,
        top: cropPosition.y,
        width: cropImage.width * cropScale,
        height: cropImage.height * cropScale,
      }
    : undefined;

  return (
    <MotionConfig reducedMotion="user">
    <motion.section
      className="mx-auto w-full max-w-[1190px] px-4 py-6 sm:px-6 lg:px-11 lg:py-9 max-[800px]:py-7 max-[620px]:px-[15px] max-[620px]:py-[23px] max-w-[1190px] "
      initial={{ opacity: 0, y: 7 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.2, 0.75, 0.25, 1] }}
    >
      <div className="mb-7 flex items-end justify-between gap-5 [&_h1]:text-[30px] [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-slate-800 dark:[&_h1]:text-slate-100 max-[620px]:items-start max-[620px]:mb-5 max-[620px]:[&_h1]:text-[26px] ">
        <div>
          <p className="mb-2 text-[10px] font-bold tracking-[1.2px] text-violet-600 dark:text-violet-300 ">
            YOUR ACCOUNT
          </p>
          <h1>
            Profile & settings
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-[620px]:max-w-[265px] max-[620px]:text-[11px] ">
            A little about you, and how you like to manage your money.
          </p>
        </div>
      </div>
      <div className="mb-4 p-6 max-[620px]:p-4 rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] ">
        <div className="mb-6 flex items-center gap-4 [&_h2]:font-semibold [&_p]:mt-1 [&_p]:text-xs [&_p]:text-slate-400 ">
          <div className="relative w-fit ">
            <div className="grid size-16 place-items-center overflow-hidden rounded-full bg-violet-100 text-xl font-bold text-violet-700 [&_img]:size-full [&_img]:object-cover ">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={`${profile.name}'s profile picture`}
                  width={63}
                  height={63}
                  unoptimized
                />
              ) : (
                initials(profile.name)
              )}
            </div>
            <button
              className="absolute bottom-0 right-0 grid size-7 place-items-center rounded-full bg-violet-600 text-white shadow "
              type="button"
              aria-label="Change profile picture"
              onClick={() => avatarInputRef.current?.click()}
            >
              <Icon name="edit" size={14} />
            </button>
            <input
              ref={avatarInputRef}
              className="hidden "
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Choose a profile picture"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <h2>
              {profile.name}
            </h2>
            <p>
              {profile.email}
            </p>
            <span className="mt-2 inline-flex rounded-full bg-violet-50 px-2 py-1 text-[10px] font-medium text-violet-700 ">
              Personal account
            </span>
            <div className="mt-2 flex gap-3 ">
              <button
                className="text-xs font-semibold text-violet-700 hover:text-violet-900 dark:text-violet-300 "
                type="button"
                onClick={() => avatarInputRef.current?.click()}
              >
                Change picture
              </button>
              {profile.avatar && (
                <button
                  className="text-xs font-semibold text-violet-700 hover:text-violet-900 dark:text-violet-300 text-rose-500 "
                  type="button"
                  onClick={() =>
                    setProfile((currentProfile) => ({
                      ...currentProfile,
                      avatar: null,
                    }))
                  }
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
        <form className="grid grid-cols-2 gap-5 [&_label]:grid [&_label]:gap-2 [&_label]:text-[10px] [&_label]:font-bold [&_label]:tracking-wide [&_label]:text-slate-500 [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-200 [&_select]:bg-white [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-sm dark:[&_input]:border-slate-700 dark:[&_input]:bg-slate-900 dark:[&_select]:border-slate-700 dark:[&_select]:bg-slate-900 max-[620px]:grid-cols-1 " onSubmit={saveProfile}>
          <label>
            FULL NAME
            <input
              value={profile.name}
              onChange={(event) =>
                setProfile({ ...profile, name: event.target.value })
              }
              required
            />
          </label>
          <label>
            EMAIL ADDRESS
            <input type="email" value={profile.email} readOnly />
          </label>
          <label>
            PREFERRED CURRENCY
            <select
              value={profile.currency}
              onChange={(event) =>
                setProfile({ ...profile, currency: event.target.value })
              }
            >
              {currencyOptions.map(([code, name]) => (
                <option key={code} value={code}>
                  {code} — {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            MONTHLY INCOME GOAL
            <input
              type="number"
              min="0"
              step="50"
              value={profile.monthlyIncome}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  monthlyIncome: Number(event.target.value),
                })
              }
            />
          </label>
          <div className="col-span-2 flex items-center justify-between gap-4 max-[620px]:col-span-1 max-[620px]:items-start max-[620px]:flex-col [&>span]:text-xs [&>span]:text-slate-400 ">
            <span>
              Your profile is stored in your account.
            </span>
            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 max-[620px]:min-h-9 max-[620px]:gap-1 max-[620px]:px-2.5 max-[620px]:text-[10px] " type="submit">
              Save changes
            </button>
          </div>
        </form>
      </div>
      <div className="mb-4 flex items-center justify-between gap-4 p-5 [&_strong]:text-sm [&_p]:mt-1 [&_p]:text-xs [&_p]:text-slate-400 max-[620px]:items-start max-[620px]:flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] ">
        <div>
          <strong>
            Appearance
          </strong>
          <p>
            Choose the look that feels right for you.
          </p>
        </div>
        <button
          className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 "
          type="button"
          role="switch"
          aria-checked={theme === "dark"}
          aria-label="Dark mode"
          onClick={toggleTheme}
        >
          <span
            className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
              theme === "dark" ? "bg-violet-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`size-5 rounded-full bg-white transition-transform ${
                theme === "dark" ? "translate-x-5" : ""
              }`}
            />
          </span>
          <span>
            {theme === "dark" ? "Dark mode" : "Light mode"}
          </span>
        </button>
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-violet-50 p-4 dark:bg-violet-950/30 max-[620px]:flex-wrap max-[620px]:items-start ">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ">
          <Icon name="leaf" size={19} />
        </span>
        <span>
          <strong>
            Your privacy matters.
          </strong>
          <small>
            Your profile and finance data are stored in your Bloom account.
          </small>
        </span>
        <button className="ml-auto text-xs font-semibold text-rose-600 " onClick={logout}>
          Sign out
        </button>
      </div>
      <AnimatePresence>
      {cropImage && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4 "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCropImage(null);
          }}
        >
          <motion.section
            className="grid w-full max-w-md justify-items-center gap-5 rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#191b25] "
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-crop-title"
            onKeyDown={(event) => {
              if (event.key === "Escape" && !savingCrop) setCropImage(null);
            }}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.2, 0.75, 0.25, 1] }}
          >
            <div className="flex w-full items-start justify-between gap-4 [&_h2]:mt-1 [&_h2]:text-lg [&_h2]:font-semibold [&_p:last-child]:mt-2 [&_p:last-child]:text-xs [&_p:last-child]:leading-relaxed [&_p:last-child]:text-slate-400">
              <div>
                <p className="mb-2 text-[10px] font-bold tracking-[1.2px] text-violet-600 dark:text-violet-300">PERSONALIZE YOUR PROFILE</p>
                <h2 id="avatar-crop-title">Crop your picture</h2>
                <p>Drag to reposition your photo, then adjust the zoom.</p>
              </div>
              <button
                className="relative inline-grid size-[34px] shrink-0 place-items-center rounded-lg bg-transparent text-slate-500 transition hover:bg-violet-50 hover:text-violet-700 active:scale-95 dark:text-slate-300 dark:hover:bg-violet-950/50"
                type="button"
                aria-label="Close crop dialog"
                autoFocus
                onClick={() => setCropImage(null)}
                disabled={savingCrop}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div
              className="relative size-[240px] touch-none cursor-grab overflow-hidden rounded-full bg-violet-50 shadow-[0_0_0_3px_white,0_0_0_4px_#e6e3f2,0_8px_24px_rgb(34_33_71_/_12%)] active:cursor-grabbing dark:shadow-[0_0_0_3px_#191b25,0_0_0_4px_#383b49,0_8px_24px_rgb(0_0_0_/_28%)] [&_img]:pointer-events-none [&_img]:absolute [&_img]:max-w-none [&_img]:select-none"
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                cropDragRef.current = {
                  pointerId: event.pointerId,
                  startX: event.clientX,
                  startY: event.clientY,
                  position: cropPosition,
                };
              }}
              onPointerMove={moveCrop}
              onPointerUp={() => {
                cropDragRef.current = null;
              }}
              onPointerCancel={() => {
                cropDragRef.current = null;
              }}
            >
              <Image
                src={cropImage.url}
                alt="Photo crop preview"
                width={cropImage.width}
                height={cropImage.height}
                unoptimized
                draggable={false}
                style={cropImageStyle}
              />
            </div>
            <label className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 text-xs font-semibold text-slate-500 [&_input]:w-full [&_input]:accent-violet-600">
              <span>Zoom</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={cropZoom}
                aria-label="Zoom photo"
                onChange={(event) => changeCropZoom(Number(event.target.value))}
              />
              <span>{cropZoom.toFixed(1)}×</span>
            </label>
            <div className="flex w-full justify-end gap-2.5">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                type="button"
                onClick={() => setCropImage(null)}
                disabled={savingCrop}
              >
                Cancel
              </button>
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 max-[620px]:min-h-9 max-[620px]:gap-1 max-[620px]:px-2.5 max-[620px]:text-[10px]"
                type="button"
                onClick={saveCroppedAvatar}
                disabled={savingCrop}
              >
                {savingCrop ? "Saving..." : "Use this picture"}
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.section>
    </MotionConfig>
  );
}
