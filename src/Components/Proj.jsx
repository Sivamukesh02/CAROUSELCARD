// React-la useRef (DOM-a pidikka), useState (data maaranum), useEffect (keyboard arrow keys) ku
import React, { useEffect, useRef, useState } from "react";

// Swiper = carousel. SwiperSlide = ovoru card slide
import { Swiper, SwiperSlide } from "swiper/react";

// EffectCoverflow = center card straight, pakkathula irukkura cards tilt aagura effect
import { EffectCoverflow } from "swiper/modules";

// gsap = animation library
import gsap from "gsap";
// useGSAP = React-la gsap-a safe-a use panna hook (@gsap/react)
import { useGSAP } from "@gsap/react";

// Swiper-oda CSS (idhu illana carousel work aagadhu)
import "swiper/css";
import "swiper/css/effect-coverflow";

// Unga style file
import "../assets/Style/style.css";

// Images
import img1 from "../assets/Image/j1.webp";
import img2 from "../assets/Image/j2.webp";
import img3 from "../assets/Image/j3.webp";
import img4 from "../assets/Image/j4.webp";
import img5 from "../assets/Image/j6.png";
import img6 from "../assets/Image/jj7.png";
import img7 from "../assets/Image/jj9.png";
import img8 from "../assets/Image/jj10.png";


const pics = [img1, img2, img3, img4, img5, img6, img7, img8];
const names = [
  "Phantom Gold",
  "Nova Crystal",
  "Royal Emerald",
  "Gold Chain",
  "Premium Ring",
  "Sunset Bangle",
  "Midnight Chain",
  "Aurora Earings",
];
const prices = [120749, 114849, 232999, 218499, 127250, 119999, 112650, 141999];

const items = names.map((name, i) => ({
  id: i,
  name,
  price: prices[i],
  image: pics[i % pics.length],
}));

const N = items.length;
const formatPrice = (n) => "₹" + n.toLocaleString("en-IN");

// Detail stack-la oru card eppadi irukkanum (rank 0 = munnadi, 1 = adutha card, 2 = adhukku pinnadi)
const poseFor = (rank) => {
  const r = Math.min(rank, 2);
  return {
    x: r * 22,
    rotate: r * 4,
    scale: 1 - r * 0.03,
    opacity: rank <= 2 ? 1 : 0,
    zIndex: N - rank,
  };
};

// Spread aana piragu irukkura FINAL look (idhu thaan unga correct-ana look)
const FINAL = { rotate: 18, stretch: -20, depth: 130 };
const COVERFLOW = { ...FINAL, modifier: 1, slideShadows: false };

function Proj() {
  const root = useRef(null);
  const prevView = useRef(null);
  const swiperRef = useRef(null);
  const dirRef = useRef(1); // 1 = next (>), -1 = previous (<)

  const [view, setView] = useState("list"); // "list" illa "detail"
  const [active, setActive] = useState(3); // list-la center-la irukkura card
  const [current, setCurrent] = useState(0); // detail-la munnadi irukkura card
  const [cart, setCart] = useState([]); // add pannina card ids

  // (<) (>) button illa keyboard arrow key click panna card maarum
  const go = (dir) => {
    dirRef.current = dir;
    setCurrent((c) => (c + dir + N) % N);
  };

  // Laptop keyboard: Left arrow = previous, Right arrow = next (detail view-la mattum)
  useEffect(() => {
    if (view !== "detail") return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);

  useGSAP(
    () => {
      const opened = prevView.current !== view;
      prevView.current = view;

      if (view === "list") {
        // 1) Ella cards-um onna pinnadi onna pile-a irukkum -> 2) pile-la irundhu spread aagum -> 3) Details button varum
        const sw = swiperRef.current;
        const cf = sw.params.coverflowEffect;
        const W = sw.slides[0].swiperSlideSize;
        const apply = () => sw.emit("setTranslate", sw.translate);

        // Pile: stretch = slide width => ella slides-um center-ku varum (8px offset = pinnadi pinnadi theriyum)
        const pile = { stretch: W - 8, rotate: 0, depth: 0 };
        Object.assign(cf, pile);
        apply();
        // Oru vela direction thappa irundha (cards pile aagama viriyudhu) flip pannum
        const span = () =>
          Math.abs(
            sw.slides[sw.slides.length - 1].getBoundingClientRect().left -
              sw.slides[0].getBoundingClientRect().left
          );
        if (span() > W) {
          pile.stretch = -(W - 8);
          Object.assign(cf, pile);
          apply();
        }

        const o = { ...pile };
        const tl = gsap.timeline();
        tl.from(".jw-title", { y: -28, opacity: 0, duration: 0.8, ease: "power3.out" })
          .to(
            o,
            {
              ...FINAL,
              duration: 1.4,
              ease: "power3.inOut",
              onUpdate: () => {
                Object.assign(cf, o);
                apply();
              },
            },
            0.6
          )
          .from(".jw-details-btn", { y: 12, opacity: 0, duration: 0.5, ease: "power3.out" }, ">-0.2");
      } else {
        // Detail view
        const dir = dirRef.current;

        gsap.utils.toArray(".jw-stack-card").forEach((el, i) => {
          const rank = (i - current + N) % N;
          const pose = poseFor(rank);
          gsap.killTweensOf(el);

          if (opened) {
            gsap.set(el, pose);
          } else if (dir === 1 && rank === N - 1) {
            // > click: munnadi irundha card left-ku pogi maraiyum, apparam pinnadi poidum
            gsap
              .timeline()
              .to(el, { x: -120, rotate: -8, opacity: 0, duration: 0.45, ease: "power2.in" })
              .set(el, poseFor(N));
          } else if (dir === -1 && rank === 0) {
            // < click: pinnadi irundha card left-la irundhu munnadi thirumba varum
            gsap.fromTo(
              el,
              { x: -120, rotate: -8, opacity: 0, zIndex: N + 1, scale: 1 },
              { ...pose, duration: 0.6, ease: "power3.out" }
            );
          } else {
            gsap.to(el, { ...pose, duration: 0.7, ease: "power3.inOut" });
          }
        });

        if (opened) {
          const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
          tl.from(".jw-left", { x: -140, opacity: 0, duration: 0.7 })
            .from(".jw-detail-info > *", { y: 24, opacity: 0, duration: 0.5, stagger: 0.1 }, "-=0.35")
            .from(".jw-back", { x: -20, opacity: 0, duration: 0.4 }, "<");
        } else {
          // Card maarumbodhu name, price, button fade aagum
          gsap.fromTo(
            ".jw-detail-info > *",
            { y: 10, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, overwrite: "auto" }
          );
        }
      }
    },
    { scope: root, dependencies: [view, current] }
  );

  const openDetails = () => {
    dirRef.current = 1;
    setCurrent(active);
    setView("detail");
  };

  const addToCart = (id, e) => {
    setCart((c) => (c.includes(id) ? c : [...c, id]));
    gsap.fromTo(e.currentTarget, { scale: 0.96 }, { scale: 1, duration: 0.3, ease: "back.out(3)" });
  };

  const item = items[current];
  const inCart = cart.includes(item.id);

  return (
    <div className="jw-page" ref={root}>
      {view === "list" ? (
        <section className="jw-list">
          <h1 className="jw-title">
            <span className="jw-title-small">The Ultimate</span>
            <span className="jw-title-big">COLLECTIONS</span>
          </h1>

          <Swiper
            className="jw-swiper"
            modules={[EffectCoverflow]}
            effect="coverflow"
            grabCursor
            centeredSlides
            slideToClickedSlide
            slidesPerView="auto"
            initialSlide={active}
            onSwiper={(s) => (swiperRef.current = s)}
            onSlideChange={(s) => setActive(s.activeIndex)}
            coverflowEffect={COVERFLOW}
          >
            {items.map((it) => (
              <SwiperSlide key={it.id} className="jw-slide">
                <div className="jw-card">
                  <img src={it.image} alt={it.name} draggable="false" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <button className="jw-details-btn" onClick={openDetails}>
            Details
          </button>
        </section>
      ) : (
        <section className="jw-detail">
          <button className="jw-back" onClick={() => setView("list")}>
            ‹ Back
          </button>

          <div className="jw-left">
            <div className="jw-stack">
              {items.map((it) => (
                <div className="jw-stack-card" key={it.id}>
                  <img src={it.image} alt={it.name} />
                </div>
              ))}
            </div>

            {/* Card keela (<) (>) buttons */}
            <div className="jw-nav">
              <button className="jw-nav-btn" onClick={() => go(-1)} aria-label="Previous">
                ‹
              </button>
              <span className="jw-count">
                {current + 1} / {N}
              </span>
              <button className="jw-nav-btn" onClick={() => go(1)} aria-label="Next">
                ›
              </button>
            </div>
          </div>

          <div className="jw-detail-info">
            <h2 className="jw-name">{item.name}</h2>
            <p className="jw-price">{formatPrice(item.price)}</p>
            <button
              className={"jw-cart" + (inCart ? " is-added" : "")}
              onClick={(e) => addToCart(item.id, e)}
            >
              {inCart ? "Added to cart ✓" : "Add to cart"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default Proj;