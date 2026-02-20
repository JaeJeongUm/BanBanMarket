import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";

const tokenKey = "banban_token";
const userKey = "banban_user";

const catLabels = { FOOD: "식품", HOUSEHOLD: "생활", BABY: "육아", PET: "반려", OTHER: "기타" };
const catEmojis = { FOOD: "🥩", HOUSEHOLD: "🧴", BABY: "🍼", PET: "🐾", OTHER: "📦" };
const statusLabel = { OPEN: "모집중", CLOSED: "마감", COMPLETED: "완료", CANCELLED: "취소" };

function pricePerUnit(room) {
  if (!room.targetQuantity) return "-";
  const unitPrice = Math.round(room.priceTotal / room.targetQuantity);
  return `${room.unit}당 ${unitPrice.toLocaleString()}원`;
}

function toDatetimeLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function datetimeText(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function AdBanner() {
  const adClient = import.meta.env.VITE_ADSENSE_CLIENT;
  const adSlot = import.meta.env.VITE_ADSENSE_SLOT;

  useEffect(() => {
    if (!adClient || !adSlot) return;
    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
  }, [adClient, adSlot]);

  if (!adClient || !adSlot) {
    return (
      <div style={{ background: "linear-gradient(135deg,#f8f9fa,#e9ecef)", border: "1px dashed #dee2e6", borderRadius: 12, padding: "14px 16px", textAlign: "center", margin: "4px 0 8px", color: "#adb5bd" }}>
        <div style={{ fontSize: 16 }}>📢</div>
        <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>광고 영역</div>
        <div style={{ fontSize: 10, marginTop: 1 }}>AdSense 설정 후 실제 광고 표시</div>
      </div>
    );
  }
  return (
    <div style={{ margin: "4px 0 8px", overflow: "hidden", borderRadius: 12 }}>
      <ins className="adsbygoogle" style={{ display: "block" }} data-ad-client={adClient} data-ad-slot={adSlot} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}

function loadKakaoSdk(appKey, callback) {
  if (window.kakao?.maps) { callback(); return; }
  const script = document.createElement("script");
  script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
  script.onload = callback;
  document.head.appendChild(script);
}

function KakaoMap({ lat, lon, name }) {
  const mapRef = useRef(null);
  const mapKey = import.meta.env.VITE_KAKAO_MAP_KEY;

  useEffect(() => {
    if (!mapRef.current || !mapKey || !lat || !lon) return;
    loadKakaoSdk(mapKey, () => {
      window.kakao.maps.load(() => {
        const center = new window.kakao.maps.LatLng(Number(lat), Number(lon));
        const map = new window.kakao.maps.Map(mapRef.current, { center, level: 3 });
        const marker = new window.kakao.maps.Marker({ position: center });
        marker.setMap(map);
        if (name) {
          const iw = new window.kakao.maps.InfoWindow({ content: `<div style="padding:4px 8px;font-size:12px;">${name}</div>` });
          iw.open(map, marker);
        }
      });
    });
  }, [lat, lon, name, mapKey]);

  if (!mapKey || !lat || !lon) {
    return <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "12px 16px", textAlign: "center", fontSize: 12, color: "#888", marginBottom: 12 }}>📍 {name || "거래 장소"}</div>;
  }
  return <div ref={mapRef} style={{ width: "100%", height: 180, borderRadius: 8, marginBottom: 12 }} />;
}

function KakaoMapMulti({ locations }) {
  const mapRef = useRef(null);
  const mapKey = import.meta.env.VITE_KAKAO_MAP_KEY;

  useEffect(() => {
    if (!mapRef.current || !mapKey || !locations?.length) return;
    loadKakaoSdk(mapKey, () => {
      window.kakao.maps.load(() => {
        const first = locations[0];
        const center = new window.kakao.maps.LatLng(Number(first.latitude), Number(first.longitude));
        const map = new window.kakao.maps.Map(mapRef.current, { center, level: 6 });
        locations.forEach((loc) => {
          const pos = new window.kakao.maps.LatLng(Number(loc.latitude), Number(loc.longitude));
          const marker = new window.kakao.maps.Marker({ position: pos, map });
          const iw = new window.kakao.maps.InfoWindow({ content: `<div style="padding:4px 8px;font-size:11px;">${loc.name}</div>` });
          window.kakao.maps.event.addListener(marker, "click", () => iw.open(map, marker));
        });
      });
    });
  }, [locations, mapKey]);

  if (!mapKey || !locations?.length) {
    return (
      <div className="map-placeholder">
        <div style={{ fontSize: 36 }}>🗺️</div>
        <div style={{ fontWeight: 700 }}>지도에서 근처 방 보기</div>
        <div style={{ fontSize: 12 }}>VITE_KAKAO_MAP_KEY 설정 후 활성화</div>
      </div>
    );
  }
  return <div ref={mapRef} style={{ width: "100%", height: 240, borderRadius: 12, marginBottom: 16 }} />;
}

function App() {
  const [page, setPage] = useState("home");
  const [health, setHealth] = useState("-");

  const [token, setToken] = useState(localStorage.getItem(tokenKey) || "");
  const [currentUser, setCurrentUser] = useState(() => {
    const raw = localStorage.getItem(userKey);
    return raw ? JSON.parse(raw) : null;
  });

  const [rooms, setRooms] = useState([]);
  const [locations, setLocations] = useState([]);
  const [catFilter, setCatFilter] = useState("전체");
  const [searchText, setSearchText] = useState("");

  const [myProfile, setMyProfile] = useState(null);
  const [myHosted, setMyHosted] = useState([]);
  const [myParticipated, setMyParticipated] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  const [authMode, setAuthMode] = useState("login");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authForm, setAuthForm] = useState({ email: "", password: "", nickname: "" });

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    category: "FOOD",
    title: "",
    targetQuantity: 2,
    unit: "개",
    priceTotal: 10000,
    meetingLocationId: "",
    meetingTime: "",
    deadline: "",
    description: ""
  });

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRoom, setDetailRoom] = useState(null);
  const [joinQty, setJoinQty] = useState(1);

  const [tradeTab, setTradeTab] = useState("join");
  const [participantOpen, setParticipantOpen] = useState(false);
  const [participantRoom, setParticipantRoom] = useState(null);

  const [checkOpen, setCheckOpen] = useState(false);
  const [checkRoom, setCheckRoom] = useState(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ roomId: "", revieweeId: "", rating: 5, comment: "", type: "FOR_HOST" });

  const [chatOpen, setChatOpen] = useState(false);
  const [chatRoom, setChatRoom] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chats, setChats] = useState({});

  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loggedIn = Boolean(token && currentUser?.id);

  const homeRooms = useMemo(() => {
    return catFilter === "전체" ? rooms : rooms.filter((r) => catLabels[r.category] === catFilter);
  }, [rooms, catFilter]);

  const searchRooms = useMemo(() => {
    const q = searchText.trim();
    if (!q) return rooms;
    return rooms.filter((r) => `${r.title} ${catLabels[r.category]}`.includes(q));
  }, [rooms, searchText]);

  const tradeData = useMemo(() => {
    const joined = myParticipated.map((r) => ({ ...r, mode: "join" }));
    const hosted = myHosted.map((r) => ({ ...r, mode: "host" }));
    const done = [...myHosted, ...myParticipated].filter((r) => r.status === "COMPLETED");
    return { joined, hosted, done };
  }, [myHosted, myParticipated]);

  useEffect(() => {
    void boot();
  }, []);

  useEffect(() => {
    if (loggedIn) {
      void refreshMyData();
    }
  }, [loggedIn]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  async function boot() {
    try {
      setLoading(true);
      const [healthData, roomData, locationData] = await Promise.all([api.health(), api.getRooms(), api.getLocations()]);
      setHealth(healthData?.status || "UP");
      setRooms(roomData || []);
      setLocations(locationData || []);
      if (locationData?.length) {
        setCreateForm((prev) => ({ ...prev, meetingLocationId: String(locationData[0].id) }));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshMyData() {
    if (!currentUser?.id) return;
    try {
      const [profile, hosted, participated, reviews] = await Promise.all([
        api.getUser(currentUser.id),
        api.getHostedRooms(currentUser.id),
        api.getParticipatedRooms(currentUser.id),
        api.getUserReviews(currentUser.id)
      ]);
      setMyProfile(profile);
      setMyHosted(hosted || []);
      setMyParticipated(participated || []);
      setMyReviews(reviews || []);
      localStorage.setItem(userKey, JSON.stringify(profile));
      setCurrentUser(profile);
    } catch (e) {
      setError(e.message);
    }
  }

  async function refreshRooms() {
    const data = await api.getRooms();
    setRooms(data || []);
  }

  async function openDetail(roomId) {
    try {
      const detail = await api.getRoomDetail(roomId, token);
      setDetailRoom(detail);
      setDetailOpen(true);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAuth() {
    try {
      setError("");
      let data;
      if (authMode === "login") {
        data = await api.login({ email: authForm.email, password: authForm.password });
      } else {
        data = await api.register(authForm);
      }
      localStorage.setItem(tokenKey, data.token);
      localStorage.setItem(userKey, JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
      setAuthModalOpen(false);
      setToast(authMode === "login" ? "로그인 성공" : "회원가입 완료");
      await refreshMyData();
      await refreshRooms();
    } catch (e) {
      setError(e.message);
    }
  }

  function logout() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    setToken("");
    setCurrentUser(null);
    setMyProfile(null);
    setMyHosted([]);
    setMyParticipated([]);
    setMyReviews([]);
    setToast("로그아웃 되었습니다");
  }

  async function submitCreateRoom() {
    try {
      if (!loggedIn) {
        setAuthModalOpen(true);
        return;
      }
      const body = {
        title: createForm.title,
        description: createForm.description,
        category: createForm.category,
        targetQuantity: Number(createForm.targetQuantity),
        unit: createForm.unit,
        priceTotal: Number(createForm.priceTotal),
        meetingLocationId: Number(createForm.meetingLocationId),
        meetingTime: new Date(createForm.meetingTime).toISOString(),
        deadline: new Date(createForm.deadline).toISOString()
      };
      await api.createRoom(body, token);
      setCreateOpen(false);
      setToast("방이 생성되었습니다");
      await refreshRooms();
      await refreshMyData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function submitJoin(roomId) {
    try {
      if (!loggedIn) {
        setAuthModalOpen(true);
        return;
      }
      await api.joinRoom(roomId, { quantity: Number(joinQty) }, token);
      setToast("방에 참여했습니다");
      await refreshRooms();
      await openDetail(roomId);
      await refreshMyData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function openParticipants(roomId) {
    try {
      const detail = await api.getRoomDetail(roomId, token);
      setParticipantRoom(detail);
      setParticipantOpen(true);
    } catch (e) {
      setError(e.message);
    }
  }

  async function openCheck(roomId) {
    try {
      const detail = await api.getRoomDetail(roomId, token);
      setCheckRoom(detail);
      setCheckOpen(true);
    } catch (e) {
      setError(e.message);
    }
  }

  async function markReceived(participantUserId) {
    try {
      await api.receiveParticipant(checkRoom.id, participantUserId, token);
      const detail = await api.getRoomDetail(checkRoom.id, token);
      setCheckRoom(detail);
      setToast("수령 처리 완료");
    } catch (e) {
      setError(e.message);
    }
  }

  async function completeRoom() {
    try {
      await api.completeRoom(checkRoom.id, token);
      setToast("거래 완료 처리되었습니다");
      setCheckOpen(false);
      await refreshRooms();
      await refreshMyData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function openReview(roomId) {
    try {
      const detail = await api.getRoomDetail(roomId, token);
      const isHost = detail.hostId === currentUser.id;
      const reviewTargets = isHost
        ? (detail.participants || []).map((p) => ({ userId: p.userId, label: p.nickname, type: "FOR_PARTICIPANT" }))
        : [{ userId: detail.hostId, label: detail.hostNickname, type: "FOR_HOST" }];

      if (!reviewTargets.length) {
        setToast("후기 대상이 없습니다");
        return;
      }

      setReviewForm({
        roomId: detail.id,
        revieweeId: reviewTargets[0].userId,
        rating: 5,
        comment: "",
        type: reviewTargets[0].type,
        targets: reviewTargets
      });
      setReviewOpen(true);
    } catch (e) {
      setError(e.message);
    }
  }

  async function submitReview() {
    try {
      await api.createReview(
        {
          roomId: Number(reviewForm.roomId),
          revieweeId: Number(reviewForm.revieweeId),
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment,
          type: reviewForm.type
        },
        token
      );
      setReviewOpen(false);
      setToast("후기가 등록되었습니다");
      await refreshMyData();
    } catch (e) {
      setError(e.message);
    }
  }

  function openChat(room) {
    setChatRoom(room);
    setChatOpen(true);
    if (!chats[room.id]) {
      setChats((prev) => ({
        ...prev,
        [room.id]: [
          { me: false, nick: room.hostNickname || "방장", avatar: "👤", text: "안녕하세요!", time: "오후 1:00" }
        ]
      }));
    }
  }

  function sendChat() {
    if (!chatRoom || !chatInput.trim()) return;
    const now = new Date();
    const h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, "0");
    const time = `${h >= 12 ? "오후" : "오전"} ${h > 12 ? h - 12 : h}:${m}`;
    const msg = { me: true, nick: currentUser?.nickname || "나", avatar: "🥕", text: chatInput.trim(), time };
    setChats((prev) => ({ ...prev, [chatRoom.id]: [...(prev[chatRoom.id] || []), msg] }));
    setChatInput("");
  }

  const locationNoticeCount = rooms.filter((r) => r.status === "OPEN").length;
  const fabHidden = page === "trade" || page === "my";

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="logo">반반<span>마켓</span></div>
          <div className="header-icons">
            <button className="icon-btn" onClick={() => setToast("새 알림 2개")}>🔔<span className="badge">2</span></button>
            <button className="icon-btn" onClick={() => (loggedIn ? setPage("my") : setAuthModalOpen(true))}>👤</button>
          </div>
        </div>
      </header>

      <div className="location-bar">
        <div className="location-bar-inner">
          <span style={{ color: "var(--primary)" }}>📍</span>
          <span className="loc-text">서울 마포구 합정동</span>
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>▾</span>
          <span className="loc-notice">지금 {locationNoticeCount}개 진행중</span>
        </div>
      </div>

      {error && <div style={{ maxWidth: 480, margin: "10px auto 0", color: "#b91c1c", fontSize: 13 }}>{error}</div>}
      {loading && <div style={{ maxWidth: 480, margin: "10px auto 0", color: "var(--text-muted)", fontSize: 12 }}>로딩중...</div>}
      <div style={{ maxWidth: 480, margin: "4px auto 0", color: "var(--text-muted)", fontSize: 11 }}>API 상태: {health}</div>

      <div className={`page ${page === "home" ? "active" : ""}`}>
        <div className="score-card" onClick={() => setPage("my")}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, opacity: 0.85 }}>내 신뢰 점수 · 탭해서 자세히 보기</div>
            <div style={{ fontSize: 16, fontWeight: 700, margin: "4px 0" }}>{currentUser?.nickname || "게스트"} 🥕</div>
            <div className="score-bar-bg"><div className="score-bar-fill" style={{ width: `${Math.min(100, myProfile?.score ?? currentUser?.score ?? 50)}%` }} /></div>
            <div className="score-bar-text"><span>방장 기준 80점</span><span>{myProfile?.score ?? currentUser?.score ?? 50}/100</span></div>
          </div>
          <div style={{ marginLeft: 16, textAlign: "center" }}>
            <div className="score-num">{myProfile?.score ?? currentUser?.score ?? 50}</div>
            <div style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.6, marginTop: 2 }}>거래 {myReviews.length}회<br />후기 {myReviews.length}</div>
          </div>
        </div>

        <div className="cats">
          {["전체", "식품", "생활", "육아", "반려", "기타"].map((c) => (
            <button key={c} className={`cat-btn ${catFilter === c ? "active" : ""}`} onClick={() => setCatFilter(c)}>
              {c === "전체" ? "🏠" : c === "식품" ? "🥩" : c === "생활" ? "🧴" : c === "육아" ? "🍼" : c === "반려" ? "🐾" : "📦"} {c === "반려" ? "반려동물" : c}
            </button>
          ))}
        </div>

        <div className="section-header">
          <div className="section-title">🔥 지금 모집중</div>
          <button className="section-more" onClick={() => setPage("search")}>더보기 →</button>
        </div>

        {homeRooms.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📭</div><div className="empty-text">해당 카테고리 방이 없어요</div><div className="empty-sub">다른 카테고리를 선택하거나 방을 직접 만들어보세요!</div></div>
        ) : homeRooms.flatMap((r, idx) => {
          const pct = Math.min(100, ((r.currentQuantity || 0) / (r.targetQuantity || 1)) * 100);
          const isFull = r.currentQuantity >= r.targetQuantity;
          const card = (
            <div className="room-card" key={r.id} onClick={() => openDetail(r.id)}>
              <div className="room-top">
                <div className="room-img">{catEmojis[r.category] || "📦"}</div>
                <div className="room-info">
                  <div className="room-cat">{catLabels[r.category] || r.category}</div>
                  <div className="room-name">{r.title}</div>
                  <div className="room-host">방장: {r.hostNickname} <span className="host-score">{r.hostScore}점</span></div>
                  <div className="room-price">₩{r.priceTotal.toLocaleString()} <span>{pricePerUnit(r)}</span></div>
                </div>
              </div>
              <div className="progress-area">
                <div className="progress-top"><span className="prog-label">모집 현황</span><span className={`prog-count ${isFull ? "full" : ""}`}>{r.currentQuantity}/{r.targetQuantity}{r.unit}</span></div>
                <div className="progress-bg"><div className={`progress-fill ${isFull ? "full" : ""}`} style={{ width: `${pct}%` }} /></div>
              </div>
              <div className="room-bottom">
                <div className="room-tags">
                  <span className="tag tag-loc">📍 {r.meetingLocation?.name}</span>
                  <span className="tag tag-time">⏰ {datetimeText(r.deadline)}</span>
                </div>
                <button className={`join-btn ${r.status !== "OPEN" ? "full-btn" : ""}`} onClick={(e) => { e.stopPropagation(); openDetail(r.id); }}>
                  {r.status === "OPEN" ? "참여하기" : "마감"}
                </button>
              </div>
            </div>
          );
          return idx > 0 && idx % 3 === 0 ? [<AdBanner key={`ad-home-${idx}`} />, card] : [card];
        })}
      </div>

      <div className={`page ${page === "search" ? "active" : ""}`}>
        <div className="search-box"><span>🔍</span><input type="text" placeholder="상품명, 카테고리 검색..." value={searchText} onChange={(e) => setSearchText(e.target.value)} /></div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🔥 인기 검색어</div>
        <div className="trend-tags">
          {["코스트코", "기저귀", "사료", "LA갈비", "세제", "분유"].map((k) => <span key={k} className="trend-tag" onClick={() => setSearchText(k)}>{k}</span>)}
        </div>
        <KakaoMapMulti locations={locations} />
        <div className="nearby-header"><div style={{ fontWeight: 700, fontSize: 14 }}>📍 내 근처 공동구매</div><div className="nearby-count">{searchRooms.length}개</div></div>
        {searchRooms.flatMap((r, idx) => {
          const row = (
            <div className="nearby-room" key={`s-${r.id}`} onClick={() => openDetail(r.id)}>
              <div className="nearby-emoji">{catEmojis[r.category] || "📦"}</div>
              <div style={{ flex: 1 }}>
                <div className="nearby-name">{r.title}</div>
                <div className="nearby-sub">⏰ {datetimeText(r.deadline)} · 방장 {r.hostScore}점</div>
                <div className="nearby-sub">📍 {r.meetingLocation?.name}</div>
              </div>
              <div className="nearby-dist">근처</div>
            </div>
          );
          return idx > 0 && idx % 3 === 0 ? [<AdBanner key={`ad-search-${idx}`} />, row] : [row];
        })}
      </div>

      <div className={`page ${page === "trade" ? "active" : ""}`}>
        <div className="trade-tabs">
          <button className={`trade-tab ${tradeTab === "join" ? "active" : ""}`} onClick={() => setTradeTab("join")}>참여중</button>
          <button className={`trade-tab ${tradeTab === "host" ? "active" : ""}`} onClick={() => setTradeTab("host")}>방장</button>
          <button className={`trade-tab ${tradeTab === "done" ? "active" : ""}`} onClick={() => setTradeTab("done")}>완료</button>
        </div>

        {loggedIn && (myProfile?.pendingReviewCount || 0) > 0 && tradeTab === "join" && (
          <div className="review-prompt">
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div className="review-text"><b>후기 작성 필수!</b><br />완료된 거래 후기를 먼저 작성해야 서비스를 계속 이용할 수 있어요.</div>
            <button className="review-btn" onClick={() => tradeData.done[0] && openReview(tradeData.done[0].id)}>작성하기</button>
          </div>
        )}

        {!loggedIn ? (
          <div className="empty-state"><div className="empty-icon">🔐</div><div className="empty-text">로그인이 필요합니다</div><div className="empty-sub">내 거래를 보려면 로그인해주세요.</div></div>
        ) : (
          <>
            {tradeTab === "join" && tradeData.joined.map((t) => (
              <div className="trade-card" key={`join-${t.id}`}>
                <div className="trade-top">
                  <div className="trade-emoji">{catEmojis[t.category] || "📦"}</div>
                  <div className="trade-info"><div className="trade-name">{t.title}</div><div className="trade-sub">{datetimeText(t.deadline)} · {t.meetingLocation?.name}</div></div>
                  <span className="status-badge status-active">{statusLabel[t.status]}</span>
                </div>
                <div className="trade-actions">
                  <button className="trade-btn trade-btn-secondary" onClick={() => openChat(t)}>💬 채팅</button>
                  <button className="trade-btn trade-btn-primary" onClick={() => openDetail(t.id)}>상세 보기</button>
                </div>
              </div>
            ))}

            {tradeTab === "host" && tradeData.hosted.map((t) => (
              <div className="trade-card" key={`host-${t.id}`}>
                <div className="trade-top">
                  <div className="trade-emoji">{catEmojis[t.category] || "📦"}</div>
                  <div className="trade-info"><div className="trade-name">{t.title}</div><div className="trade-sub">{datetimeText(t.deadline)} · {t.meetingLocation?.name}</div></div>
                  <span className="status-badge status-wait">{statusLabel[t.status]}</span>
                </div>
                <div className="trade-actions">
                  <button className="trade-btn trade-btn-secondary" onClick={() => openParticipants(t.id)}>👥 참여자</button>
                  <button className="trade-btn trade-btn-primary" onClick={() => openCheck(t.id)}>✅ 수령 체크</button>
                </div>
              </div>
            ))}

            {tradeTab === "done" && tradeData.done.map((t) => (
              <div className="history-card" key={`done-${t.id}`}>
                <div className="history-item">
                  <div className="trade-emoji">{catEmojis[t.category] || "📦"}</div>
                  <div className="history-info">
                    <div className="history-name">{t.title}</div>
                    <div className="history-date">{datetimeText(t.updatedAt || t.deadline)} · {t.meetingLocation?.name}</div>
                    <div className="history-review">후기 작성 가능</div>
                  </div>
                  <button className="review-btn" onClick={() => openReview(t.id)}>후기</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className={`page ${page === "my" ? "active" : ""}`}>
        {!loggedIn ? (
          <div className="my-profile-card">
            <div className="my-nick">로그인이 필요합니다</div>
            <div className="my-sub">회원가입 후 공동구매를 시작하세요.</div>
            <button className="submit-btn" onClick={() => setAuthModalOpen(true)}>로그인 / 회원가입</button>
          </div>
        ) : (
          <>
            <div className="my-profile-card">
              <div className="my-avatar">🥕</div>
              <div className="my-nick">{myProfile?.nickname || currentUser?.nickname}</div>
              <div className="my-sub">{myProfile?.email}</div>
              <div className="my-stats">
                <div className="my-stat"><div className="my-stat-num">{tradeData.done.length}</div><div className="my-stat-label">총 거래</div></div>
                <div className="my-stat"><div className="my-stat-num">{myHosted.length}</div><div className="my-stat-label">방장 경험</div></div>
                <div className="my-stat"><div className="my-stat-num">{myReviews.length}</div><div className="my-stat-label">받은 후기</div></div>
                <div className="my-stat"><div className="my-stat-num">{myProfile?.pendingReviewCount || 0}</div><div className="my-stat-label">미작성 후기</div></div>
              </div>
            </div>

            <div className="my-score-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>🏆 신뢰 점수</div>
                <div style={{ fontFamily: "Gmarket Sans", fontSize: 28, fontWeight: 700, color: "var(--primary)" }}>{myProfile?.score ?? 0}점</div>
              </div>
              <div className="score-progress-bg"><div className="score-progress-fill" style={{ width: `${Math.min(100, myProfile?.score ?? 0)}%` }} /></div>
              <div className="score-milestones" style={{ marginBottom: 14 }}><span>0</span><span style={{ color: "var(--primary)", fontWeight: 700 }}>✓ 방장 가능 (80)</span><span style={{ fontWeight: 700, color: "#a855f7" }}>VIP (95)</span><span>100</span></div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>내 최근 후기</div>
              {myReviews.slice(0, 4).map((rv) => (
                <div className="score-hist-item" key={rv.id}><span>{rv.comment || "후기 코멘트 없음"}</span><span className="score-up">{rv.rating}점</span></div>
              ))}
            </div>

            <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)", fontSize: 12 }}>
              반반마켓 v0.1 MVP · ⓒ 2025<br />
              <span style={{ color: "var(--primary)", cursor: "pointer", fontWeight: 700 }} onClick={logout}>로그아웃</span>
            </div>
          </>
        )}
      </div>

      <button className={`fab ${fabHidden ? "hidden" : ""}`} onClick={() => setCreateOpen(true)}>＋ 방 만들기</button>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <button className={`nav-item ${page === "home" ? "active" : ""}`} onClick={() => setPage("home")}><div className="nav-icon">🏠</div>홈</button>
          <button className={`nav-item ${page === "search" ? "active" : ""}`} onClick={() => setPage("search")}><div className="nav-icon">🔍</div>탐색</button>
          <button className={`nav-item ${page === "trade" ? "active" : ""}`} onClick={() => setPage("trade")}><div className="nav-icon">📋</div>내 거래</button>
          <button className={`nav-item ${page === "my" ? "active" : ""}`} onClick={() => setPage("my")}><div className="nav-icon">👤</div>마이</button>
        </div>
      </nav>

      <div className={`modal-overlay ${createOpen ? "open" : ""}`} onClick={(e) => e.target.classList.contains("modal-overlay") && setCreateOpen(false)}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-title">방 만들기</div>
          <div className="form-group"><label className="form-label">카테고리</label><select className="form-select" value={createForm.category} onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value }))}><option value="FOOD">🥩 식품</option><option value="HOUSEHOLD">🧴 생활용품</option><option value="BABY">🍼 육아</option><option value="PET">🐾 반려동물</option><option value="OTHER">📦 기타</option></select></div>
          <div className="form-group"><label className="form-label">상품명</label><input className="form-input" value={createForm.title} onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))} placeholder="예) 코스트코 LA갈비" /></div>
          <div className="form-group"><label className="form-label">설명</label><input className="form-input" value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} placeholder="간단한 상품 설명" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">총 수량</label><input className="form-input" type="number" min="1" value={createForm.targetQuantity} onChange={(e) => setCreateForm((p) => ({ ...p, targetQuantity: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">단위</label><input className="form-input" value={createForm.unit} onChange={(e) => setCreateForm((p) => ({ ...p, unit: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">총 가격 (원)</label><input className="form-input" type="number" min="1" value={createForm.priceTotal} onChange={(e) => setCreateForm((p) => ({ ...p, priceTotal: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">거래 장소</label><select className="form-select" value={createForm.meetingLocationId} onChange={(e) => setCreateForm((p) => ({ ...p, meetingLocationId: e.target.value }))}>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">만나는 시간</label><input className="form-input" type="datetime-local" value={createForm.meetingTime} onChange={(e) => setCreateForm((p) => ({ ...p, meetingTime: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">마감 시간</label><input className="form-input" type="datetime-local" value={createForm.deadline} onChange={(e) => setCreateForm((p) => ({ ...p, deadline: e.target.value }))} /></div>
          <button className="submit-btn" onClick={submitCreateRoom}>방 생성하기</button>
          <button className="cancel-btn" onClick={() => setCreateOpen(false)}>취소</button>
        </div>
      </div>

      <div className={`modal-overlay ${detailOpen ? "open" : ""}`} onClick={(e) => e.target.classList.contains("modal-overlay") && setDetailOpen(false)}>
        <div className="modal" id="detailContent">
          {detailRoom && (
            <>
              <div className="modal-handle" />
              <div className="detail-hero">{catEmojis[detailRoom.category] || "📦"}</div>
              <div className="detail-title">{detailRoom.title}</div>
              <div className="progress-bg" style={{ marginBottom: 12 }}><div className={`progress-fill ${(detailRoom.currentQuantity >= detailRoom.targetQuantity) ? "full" : ""}`} style={{ width: `${Math.min(100, (detailRoom.currentQuantity / detailRoom.targetQuantity) * 100)}%` }} /></div>
              <KakaoMap lat={detailRoom.meetingLocation?.latitude} lon={detailRoom.meetingLocation?.longitude} name={detailRoom.meetingLocation?.name} />
              <div className="detail-section">
                <div className="detail-sec-title">거래 정보</div>
                <div className="detail-info-row"><span className="detail-info-label">방장</span><span className="detail-info-val">{detailRoom.hostNickname} ({detailRoom.hostScore}점)</span></div>
                <div className="detail-info-row"><span className="detail-info-label">참여 가격</span><span className="detail-info-val" style={{ color: "var(--primary)" }}>₩{detailRoom.priceTotal.toLocaleString()}</span></div>
                <div className="detail-info-row"><span className="detail-info-label">거래 장소</span><span className="detail-info-val">📍 {detailRoom.meetingLocation?.name} · {detailRoom.meetingLocation?.address}</span></div>
                <div className="detail-info-row"><span className="detail-info-label">마감</span><span className="detail-info-val">⏰ {datetimeText(detailRoom.deadline)}</span></div>
              </div>
              <div className="detail-section">
                <div className="detail-sec-title">참여자 ({detailRoom.participants?.length || 0}명)</div>
                <div className="participants-list">{(detailRoom.participants || []).map((p) => <div key={p.userId} className="participant-chip">{p.nickname}</div>)}</div>
              </div>

              {detailRoom.canJoin ? (
                <>
                  <div className="form-row"><div className="form-group"><label className="form-label">참여 수량</label><input className="form-input" type="number" min="1" value={joinQty} onChange={(e) => setJoinQty(e.target.value)} /></div></div>
                  <button className="submit-btn" onClick={() => submitJoin(detailRoom.id)}>이 방에 참여하기</button>
                </>
              ) : (
                <button className="submit-btn" style={{ background: "var(--text-muted)", cursor: "default" }}>참여 불가</button>
              )}
              <button className="cancel-btn" onClick={() => setDetailOpen(false)}>닫기</button>
            </>
          )}
        </div>
      </div>

      <div className={`modal-overlay ${participantOpen ? "open" : ""}`} onClick={(e) => e.target.classList.contains("modal-overlay") && setParticipantOpen(false)}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-title">👥 참여자 목록 ({participantRoom?.participants?.length || 0}명)</div>
          {(participantRoom?.participants || []).map((p) => (
            <div className="participant-row" key={`p-${p.userId}`}>
              <div className="participant-avatar">👤</div>
              <div className="participant-info"><div className="participant-nick">{p.nickname}</div><div className="participant-detail">신청 수량: {p.quantity} · 상태: {p.status}</div></div>
            </div>
          ))}
          <button className="cancel-btn" onClick={() => setParticipantOpen(false)}>닫기</button>
        </div>
      </div>

      <div className={`modal-overlay ${checkOpen ? "open" : ""}`} onClick={(e) => e.target.classList.contains("modal-overlay") && setCheckOpen(false)}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-title">수령 체크</div>
          <div className="chat-header" style={{ marginBottom: 12 }}><span style={{ fontSize: 28 }}>{catEmojis[checkRoom?.category] || "📦"}</span><div><div className="chat-room-name">{checkRoom?.title}</div><div className="chat-room-sub">{checkRoom?.meetingLocation?.name}</div></div></div>
          <div className="check-summary"><b>{(checkRoom?.participants || []).filter((p) => p.status === "RECEIVED").length}/{(checkRoom?.participants || []).length}</b>명 수령 완료</div>
          {(checkRoom?.participants || []).map((p) => (
            <div className={`check-row ${p.status === "RECEIVED" ? "checked" : ""}`} key={`c-${p.userId}`}>
              <div className="check-info"><div className="check-name">👤 {p.nickname}</div><div className="check-qty">신청 수량: {p.quantity}</div></div>
              {p.status === "RECEIVED" ? <span className="check-status check-done">수령 완료</span> : <button className="trade-btn trade-btn-primary" onClick={() => markReceived(p.userId)}>수령 처리</button>}
            </div>
          ))}
          <button className="submit-btn" style={{ marginTop: 12 }} onClick={completeRoom}>완료 처리</button>
          <button className="cancel-btn" onClick={() => setCheckOpen(false)}>닫기</button>
        </div>
      </div>

      <div className={`modal-overlay ${reviewOpen ? "open" : ""}`} onClick={(e) => e.target.classList.contains("modal-overlay") && setReviewOpen(false)}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-title">⭐ 후기 작성</div>
          <div className="form-group"><label className="form-label">대상</label><select className="form-select" value={reviewForm.revieweeId} onChange={(e) => {
            const selected = (reviewForm.targets || []).find((t) => String(t.userId) === e.target.value);
            setReviewForm((p) => ({ ...p, revieweeId: Number(e.target.value), type: selected?.type || p.type }));
          }}>{(reviewForm.targets || []).map((t) => <option key={t.userId} value={t.userId}>{t.label}</option>)}</select></div>
          <div className="form-group"><label className="form-label">거래 만족도</label><div className="star-row">{[1, 2, 3, 4, 5].map((s) => <button key={s} className={`star-btn ${reviewForm.rating >= s ? "on" : ""}`} onClick={() => setReviewForm((p) => ({ ...p, rating: s }))}>⭐</button>)}</div></div>
          <div className="form-group"><label className="form-label">한 줄 후기</label><input className="form-input" value={reviewForm.comment} onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))} placeholder="예) 시간도 잘 지키고 수량도 딱 맞았어요!" /></div>
          <button className="submit-btn" onClick={submitReview}>후기 제출하기</button>
          <button className="cancel-btn" onClick={() => setReviewOpen(false)}>취소</button>
        </div>
      </div>

      <div className={`modal-overlay ${chatOpen ? "open" : ""}`} onClick={(e) => e.target.classList.contains("modal-overlay") && setChatOpen(false)}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="chat-header">
            <span style={{ fontSize: 28 }}>{catEmojis[chatRoom?.category] || "💬"}</span>
            <div className="chat-room-info"><div className="chat-room-name">{chatRoom?.title}</div><div className="chat-room-sub">{chatRoom?.meetingLocation?.name}</div></div>
          </div>
          <div className="chat-messages">{(chats[chatRoom?.id] || []).map((m, i) => <div key={i} className={`chat-msg ${m.me ? "me" : ""}`}><div className="chat-avatar">{m.avatar}</div><div className="chat-bubble-wrap">{!m.me && <div className="chat-nick">{m.nick}</div>}<div className="chat-bubble">{m.text}</div><div className="chat-time">{m.time}</div></div></div>)}</div>
          <div className="chat-input-row"><input className="chat-input" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="메시지 입력..." /><button className="chat-send-btn" onClick={sendChat}>➤</button></div>
          <button className="cancel-btn" onClick={() => setChatOpen(false)}>닫기</button>
        </div>
      </div>

      <div className={`modal-overlay ${authModalOpen ? "open" : ""}`} onClick={(e) => e.target.classList.contains("modal-overlay") && setAuthModalOpen(false)}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-title">{authMode === "login" ? "로그인" : "회원가입"}</div>
          <div className="form-group"><label className="form-label">이메일</label><input className="form-input" value={authForm.email} onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">비밀번호</label><input className="form-input" type="password" value={authForm.password} onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))} /></div>
          {authMode === "register" && <div className="form-group"><label className="form-label">닉네임</label><input className="form-input" value={authForm.nickname} onChange={(e) => setAuthForm((p) => ({ ...p, nickname: e.target.value }))} /></div>}
          <button className="submit-btn" onClick={handleAuth}>{authMode === "login" ? "로그인" : "가입하기"}</button>
          <button className="cancel-btn" onClick={() => setAuthMode((m) => (m === "login" ? "register" : "login"))}>{authMode === "login" ? "회원가입으로 전환" : "로그인으로 전환"}</button>
        </div>
      </div>

      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
    </>
  );
}

export default App;
