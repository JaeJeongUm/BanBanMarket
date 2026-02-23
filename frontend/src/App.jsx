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

function buildCreateDateOptions(days = 21) {
  const week = ["일", "월", "화", "수", "목", "금", "토"];
  const options = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    options.push({
      value: `${yyyy}-${mm}-${dd}`,
      label: `${mm}/${dd} (${week[d.getDay()]})`
    });
  }
  return options;
}

function toIsoFromDateAndTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  return new Date(`${dateValue}T${timeValue}:00`).toISOString();
}

// 마감 1시간 이내 여부
function isUrgent(deadline) {
  const diff = new Date(deadline) - new Date();
  return diff < 60 * 60 * 1000 && diff > 0;
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

let kakaoSdkPromise = null;

function loadKakaoSdk(appKey) {
  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao.maps);
  }
  if (kakaoSdkPromise) {
    return kakaoSdkPromise;
  }

  kakaoSdkPromise = new Promise((resolve, reject) => {
    const scriptId = "kakao-maps-sdk";
    let script = document.getElementById(scriptId);

    const onLoaded = () => {
      if (!window.kakao?.maps) {
        reject(new Error("Kakao maps SDK not available after script load"));
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao.maps));
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
      script.async = true;
      script.onload = onLoaded;
      script.onerror = () => reject(new Error("Failed to load Kakao map SDK"));
      document.head.appendChild(script);
      return;
    }

    if (window.kakao?.maps) {
      onLoaded();
      return;
    }

    script.addEventListener("load", onLoaded, { once: true });
  });

  return kakaoSdkPromise;
}

function KakaoMap({ lat, lon, name }) {
  const mapRef = useRef(null);
  const mapKey = import.meta.env.VITE_KAKAO_MAP_KEY;

  useEffect(() => {
    if (!mapRef.current || !mapKey || !lat || !lon) return;
    let disposed = false;
    loadKakaoSdk(mapKey)
      .then(() => {
        if (disposed || !mapRef.current) return;
        const center = new window.kakao.maps.LatLng(Number(lat), Number(lon));
        const map = new window.kakao.maps.Map(mapRef.current, { center, level: 3 });
        const marker = new window.kakao.maps.Marker({ position: center });
        marker.setMap(map);
        if (name) {
          const iw = new window.kakao.maps.InfoWindow({ content: `<div style="padding:4px 8px;font-size:12px;">${name}</div>` });
          iw.open(map, marker);
        }
        // Modal animation/layout 반영 후 지도 재계산
        setTimeout(() => {
          if (disposed) return;
          map.relayout();
          map.setCenter(center);
        }, 280);
      })
      .catch(() => {});
    return () => {
      disposed = true;
    };
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
    let disposed = false;
    loadKakaoSdk(mapKey)
      .then(() => {
        if (disposed || !mapRef.current) return;
        const first = locations[0];
        const center = new window.kakao.maps.LatLng(Number(first.latitude), Number(first.longitude));
        const map = new window.kakao.maps.Map(mapRef.current, { center, level: 6 });
        locations.forEach((loc) => {
          const pos = new window.kakao.maps.LatLng(Number(loc.latitude), Number(loc.longitude));
          const marker = new window.kakao.maps.Marker({ position: pos, map });
          const iw = new window.kakao.maps.InfoWindow({ content: `<div style="padding:4px 8px;font-size:11px;">${loc.name}</div>` });
          window.kakao.maps.event.addListener(marker, "click", () => iw.open(map, marker));
        });
        setTimeout(() => {
          if (disposed) return;
          map.relayout();
          map.setCenter(center);
        }, 30);
      })
      .catch(() => {});
    return () => {
      disposed = true;
    };
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

function KakaoLocationPicker({
  locations,
  selectedLocationId,
  selectedCustomLocation,
  onSelectSaved,
  onSelectCustom
}) {
  const mapRef = useRef(null);
  const mapKey = import.meta.env.VITE_KAKAO_MAP_KEY;
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const selectedSaved = locations.find((l) => String(l.id) === String(selectedLocationId));
  const selected = selectedSaved || selectedCustomLocation || locations[0];

  useEffect(() => {
    if (!mapRef.current || !mapKey || !selected) return;
    let disposed = false;
    loadKakaoSdk(mapKey)
      .then(() => {
        if (disposed || !mapRef.current) return;
        const center = new window.kakao.maps.LatLng(Number(selected.latitude), Number(selected.longitude));
        const map = new window.kakao.maps.Map(mapRef.current, { center, level: 5 });
        const activeMarker = new window.kakao.maps.Marker({ position: center, map });
        const activeIw = new window.kakao.maps.InfoWindow({ content: `<div style="padding:4px 8px;font-size:11px;">${selected.name || "선택 위치"}</div>` });
        activeIw.open(map, activeMarker);
        map.panTo(center);

        const geocoder = new window.kakao.maps.services.Geocoder();
        window.kakao.maps.event.addListener(map, "click", (mouseEvent) => {
          const latlng = mouseEvent.latLng;
          const lat = Number(latlng.getLat().toFixed(7));
          const lon = Number(latlng.getLng().toFixed(7));
          activeMarker.setPosition(latlng);
          map.panTo(latlng);
          geocoder.coord2Address(lon, lat, (result, status) => {
            if (status === window.kakao.maps.services.Status.OK && result?.[0]) {
              const road = result[0].road_address?.address_name || "";
              const jibun = result[0].address?.address_name || "";
              const address = road || jibun || `${lat}, ${lon}`;
              onSelectCustom({
                name: road ? `선택 위치 (${road})` : "선택 위치",
                address,
                latitude: lat,
                longitude: lon
              });
              return;
            }
            onSelectCustom({
              name: "선택 위치",
              address: `${lat}, ${lon}`,
              latitude: lat,
              longitude: lon
            });
          });
        });
      })
      .catch(() => {});
    return () => {
      disposed = true;
    };
  }, [mapKey, onSelectCustom, selected]);

  const selectedName = selected?.name;

  function searchPlaces() {
    if (!keyword.trim() || !window.kakao?.maps?.services) return;
    const places = new window.kakao.maps.services.Places();
    places.keywordSearch(keyword.trim(), (data, status) => {
      if (status !== window.kakao.maps.services.Status.OK) {
        setSearchResults([]);
        return;
      }
      setSearchResults(data.slice(0, 6));
    });
  }

  if (!locations?.length) {
    return <div className="map-placeholder" style={{ height: 120 }}>거래 장소 데이터가 없습니다.</div>;
  }

  if (!mapKey) {
    return (
      <div>
        <div className="location-chip-wrap">
          {locations.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`location-chip ${String(l.id) === String(selectedLocationId) ? "active" : ""}`}
              onClick={() => onSelectSaved(String(l.id))}
            >
              {l.name}
            </button>
          ))}
        </div>
        <div className="nearby-sub" style={{ marginTop: 8 }}>선택된 장소: {selectedName || "-"}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="map-search-row">
        <input
          className="form-input"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchPlaces()}
          placeholder="지도에서 장소 검색 (예: 강남역 11번 출구)"
        />
        <button type="button" className="review-btn map-search-btn" onClick={searchPlaces}>검색</button>
      </div>
      {searchResults.length > 0 && (
        <div className="map-search-results">
          {searchResults.map((r) => (
            <button
              key={`${r.id}-${r.x}-${r.y}`}
              type="button"
              className="map-search-item"
              onClick={() => {
                onSelectCustom({
                  name: r.place_name,
                  address: r.road_address_name || r.address_name,
                  latitude: Number(r.y),
                  longitude: Number(r.x)
                });
                setKeyword(r.place_name);
                setSearchResults([]);
              }}
            >
              <div className="map-search-name">{r.place_name}</div>
              <div className="map-search-address">{r.road_address_name || r.address_name}</div>
            </button>
          ))}
        </div>
      )}
      <div ref={mapRef} className="create-map" />
      <div className="location-chip-wrap">
        {locations.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`location-chip ${String(l.id) === String(selectedLocationId) ? "active" : ""}`}
            onClick={() => onSelectSaved(String(l.id))}
          >
            {l.name}
          </button>
        ))}
      </div>
      <div className="nearby-sub" style={{ marginTop: 8 }}>선택된 장소: {selectedName || "-"}</div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState("home");

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
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(() => {
    const options = buildCreateDateOptions(21);
    const first = options[0]?.value || "";
    return {
      category: "FOOD",
      title: "",
      targetQuantity: 2,
      unit: "개",
      priceTotal: 10000,
      meetingLocationId: "",
      meetingLocationName: "",
      meetingLocationAddress: "",
      meetingLatitude: "",
      meetingLongitude: "",
      meetingDate: first,
      meetingTime: "19:00",
      deadlineDate: first,
      deadlineTime: "18:00",
      description: ""
    };
  });
  const createDateOptions = useMemo(() => buildCreateDateOptions(21), []);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRoom, setDetailRoom] = useState(null);
  const [joinQty, setJoinQty] = useState(1);
  const detailModalRef = useRef(null);

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
  const [authLoading, setAuthLoading] = useState(false);

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

  // 인증 모달 닫기 시 초기화
  function closeAuthModal() {
    setAuthModalOpen(false);
    setAuthForm({ email: "", password: "", nickname: "" });
    setAuthError("");
    setShowPassword(false);
  }

  async function boot() {
    try {
      setLoading(true);
      const [roomData, locationData] = await Promise.all([api.getRooms(), api.getLocations()]);
      setRooms(roomData || []);
      setLocations(locationData || []);
      if (locationData?.length) {
        const first = locationData[0];
        setCreateForm((prev) => ({
          ...prev,
          meetingLocationId: String(first.id),
          meetingLocationName: first.name,
          meetingLocationAddress: first.address,
          meetingLatitude: first.latitude,
          meetingLongitude: first.longitude
        }));
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
      // 모달 스크롤 최상단으로
      setTimeout(() => {
        if (detailModalRef.current) detailModalRef.current.scrollTop = 0;
      }, 50);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAuth() {
    try {
      setAuthError("");
      setAuthLoading(true);
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
      closeAuthModal();
      setToast(authMode === "login" ? "로그인 성공" : "회원가입 완료");
      await refreshMyData();
      await refreshRooms();
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
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
      const meetingTimeIso = toIsoFromDateAndTime(createForm.meetingDate, createForm.meetingTime);
      const deadlineIso = toIsoFromDateAndTime(createForm.deadlineDate, createForm.deadlineTime);
      if (!meetingTimeIso || !deadlineIso) {
        setError("만나는 시간과 마감 시간을 모두 입력해주세요.");
        return;
      }
      if (new Date(deadlineIso) > new Date(meetingTimeIso)) {
        setError("마감 시간은 만나는 시간보다 같거나 빨라야 합니다.");
        return;
      }
      const body = {
        title: createForm.title,
        description: createForm.description,
        category: createForm.category,
        targetQuantity: Number(createForm.targetQuantity),
        unit: createForm.unit,
        priceTotal: Number(createForm.priceTotal),
        meetingLocationId: createForm.meetingLocationId ? Number(createForm.meetingLocationId) : null,
        meetingLocationName: createForm.meetingLocationName || null,
        meetingLocationAddress: createForm.meetingLocationAddress || null,
        meetingLatitude: createForm.meetingLatitude ? Number(createForm.meetingLatitude) : null,
        meetingLongitude: createForm.meetingLongitude ? Number(createForm.meetingLongitude) : null,
        meetingTime: meetingTimeIso,
        deadline: deadlineIso
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

  // FAB 클릭 처리: 점수/미작성후기 체크 후 토스트, 아니면 모달 오픈
  function handleFabClick() {
    if (!loggedIn) {
      setAuthModalOpen(true);
      return;
    }
    const score = myProfile?.score ?? currentUser?.score ?? 50;
    const pendingCount = myProfile?.pendingReviewCount || 0;
    if (pendingCount > 0) {
      setToast("미작성 후기를 먼저 작성해주세요");
      return;
    }
    if (score < 80) {
      setToast("신뢰 점수 80점 이상이어야 방을 만들 수 있어요");
      return;
    }
    setCreateOpen(true);
  }

  // 내 거래 탭 클릭: 비로그인이면 로그인 모달
  function handleTradeTabClick() {
    if (!loggedIn) {
      setAuthModalOpen(true);
      return;
    }
    setPage("trade");
  }

  const locationNoticeCount = rooms.filter((r) => r.status === "OPEN").length;
  const fabHidden = page === "trade" || page === "my";
  const notificationCount = 0;

  // 상태 배지 스타일 결정
  function getStatusBadgeClass(status) {
    if (status === "OPEN") return "room-status-badge room-status-open";
    if (status === "CLOSED") return "room-status-badge room-status-closed";
    if (status === "COMPLETED") return "room-status-badge room-status-completed";
    return "room-status-badge room-status-completed";
  }

  return (
    <>
      {!loggedIn && !authModalOpen && (
        <div className="login-required-overlay">
          <div className="login-required-card">
            <div className="login-required-title">로그인이 필요합니다</div>
            <div className="login-required-sub">
              테스트 관리자 계정으로 로그인하세요.
              <br />
              아이디: <b>admin</b> / 비밀번호: <b>admin</b>
            </div>
            <button
              className="submit-btn"
              style={{ marginTop: 12 }}
              onClick={() => {
                setAuthMode("login");
                setAuthForm({ email: "admin", password: "admin", nickname: "" });
                setAuthModalOpen(true);
              }}
            >
              로그인하기
            </button>
          </div>
        </div>
      )}

      <header className="header">
        <div className="header-inner">
          <div className="logo">반반<span>마켓</span></div>
          <div className="header-icons">
            <button
              className="icon-btn"
              onClick={() => setToast(notificationCount > 0 ? `새 알림 ${notificationCount}개` : "새 알림이 없습니다")}
            >
              🔔
              {notificationCount > 0 && <span className="badge">{notificationCount}</span>}
            </button>
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

      {error && (
        <div style={{ maxWidth: 480, margin: "10px auto 0", padding: "0 16px", color: "#b91c1c", fontSize: 13 }}>
          {error}
        </div>
      )}
      {loading && (
        <div className="loading-center">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
        </div>
      )}

      {/* 홈 페이지 */}
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
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-text">해당 카테고리 방이 없어요</div>
            <div className="empty-sub">다른 카테고리를 선택하거나 방을 직접 만들어보세요!</div>
          </div>
        ) : homeRooms.flatMap((r, idx) => {
          const pct = Math.min(100, ((r.currentQuantity || 0) / (r.targetQuantity || 1)) * 100);
          const isFull = r.currentQuantity >= r.targetQuantity;
          const urgent = r.status === "OPEN" && r.deadline && isUrgent(r.deadline);
          const card = (
            <div className="room-card" key={r.id} onClick={() => openDetail(r.id)}>
              <div className="room-top" style={{ position: "relative" }}>
                <div className="room-img">{catEmojis[r.category] || "📦"}</div>
                <div className="room-info">
                  <div className="room-cat">{catLabels[r.category] || r.category}</div>
                  <div className="room-name">{r.title}</div>
                  <div className="room-host">방장: {r.hostNickname} <span className="host-score">{r.hostScore}점</span></div>
                  <div className="room-price">₩{r.priceTotal.toLocaleString()} <span>{pricePerUnit(r)}</span></div>
                </div>
                {/* 상태 배지 */}
                <span className={getStatusBadgeClass(r.status)}>{statusLabel[r.status] || r.status}</span>
              </div>
              <div className="progress-area">
                <div className="progress-top">
                  <span className="prog-label">모집 현황</span>
                  <span className={`prog-count ${isFull ? "full" : ""}`}>{r.currentQuantity}/{r.targetQuantity}{r.unit}</span>
                </div>
                <div className="progress-bg"><div className={`progress-fill ${isFull ? "full" : ""}`} style={{ width: `${pct}%` }} /></div>
              </div>
              <div className="room-bottom">
                <div className="room-tags">
                  <span className="tag tag-loc">📍 {r.meetingLocation?.name}</span>
                  <span className={`tag tag-time ${urgent ? "tag-urgent" : ""}`}>
                    ⏰ {datetimeText(r.deadline)}{urgent ? " 🔥곧마감" : ""}
                  </span>
                </div>
                <button
                  className={`join-btn ${r.status !== "OPEN" ? "full-btn" : ""}`}
                  onClick={(e) => { e.stopPropagation(); openDetail(r.id); }}
                >
                  {r.status === "OPEN" ? "참여하기" : "마감"}
                </button>
              </div>
            </div>
          );
          return idx > 0 && idx % 3 === 0 ? [<AdBanner key={`ad-home-${idx}`} />, card] : [card];
        })}
      </div>

      {/* 탐색 페이지 */}
      <div className={`page ${page === "search" ? "active" : ""}`}>
        <div className="search-box">
          <span>🔍</span>
          <input type="text" placeholder="상품명, 카테고리 검색..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🔥 인기 검색어</div>
        <div className="trend-tags">
          {["코스트코", "기저귀", "사료", "LA갈비", "세제", "분유"].map((k) => (
            <span key={k} className="trend-tag" onClick={() => setSearchText(k)}>{k}</span>
          ))}
        </div>
        {page === "search" && <KakaoMapMulti locations={locations} />}
        <div className="nearby-header">
          <div style={{ fontWeight: 700, fontSize: 14 }}>📍 내 근처 공동구매</div>
          <div className="nearby-count">{searchRooms.length}개</div>
        </div>
        {searchRooms.flatMap((r, idx) => {
          const urgent = r.status === "OPEN" && r.deadline && isUrgent(r.deadline);
          const row = (
            <div className="nearby-room" key={`s-${r.id}`} onClick={() => openDetail(r.id)}>
              <div className="nearby-emoji">{catEmojis[r.category] || "📦"}</div>
              <div style={{ flex: 1 }}>
                <div className="nearby-name">{r.title}</div>
                <div className="nearby-sub">방장 {r.hostScore}점</div>
                <div className="nearby-sub">📍 {r.meetingLocation?.name}</div>
                <div className="room-tags" style={{ marginTop: 4 }}>
                  <span className={`tag tag-time ${urgent ? "tag-urgent" : ""}`}>
                    ⏰ {datetimeText(r.deadline)}{urgent ? " 🔥곧마감" : ""}
                  </span>
                </div>
              </div>
              <div className="nearby-dist">근처</div>
              <span className={`${getStatusBadgeClass(r.status)} nearby-status-badge`}>{statusLabel[r.status] || r.status}</span>
            </div>
          );
          return idx > 0 && idx % 3 === 0 ? [<AdBanner key={`ad-search-${idx}`} />, row] : [row];
        })}
      </div>

      {/* 내 거래 페이지 */}
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
          <div className="empty-state">
            <div className="empty-icon">🔐</div>
            <div className="empty-text">로그인이 필요합니다</div>
            <div className="empty-sub">내 거래를 보려면 로그인해주세요.</div>
            <button className="submit-btn" style={{ marginTop: 16, maxWidth: 200, margin: "16px auto 0", display: "block" }} onClick={() => setAuthModalOpen(true)}>로그인하기</button>
          </div>
        ) : (
          <>
            {tradeTab === "join" && (
              tradeData.joined.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <div className="empty-text">참여중인 거래가 없습니다</div>
                  <div className="empty-sub">홈/탐색에서 공동구매에 참여해보세요.</div>
                </div>
              ) : (
                tradeData.joined.map((t) => (
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
                ))
              )
            )}

            {tradeTab === "host" && (
              tradeData.hosted.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📦</div>
                  <div className="empty-text">방장으로 진행중인 거래가 없습니다</div>
                  <div className="empty-sub">조건을 충족하면 새 방을 만들어 시작할 수 있어요.</div>
                </div>
              ) : (
                tradeData.hosted.map((t) => (
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
                ))
              )
            )}

            {tradeTab === "done" && (
              tradeData.done.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <div className="empty-text">완료된 거래가 없습니다</div>
                  <div className="empty-sub">거래가 완료되면 이곳에서 후기 작성이 가능합니다.</div>
                </div>
              ) : (
                tradeData.done.map((t) => (
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
                ))
              )
            )}
          </>
        )}
      </div>

      {/* 마이 페이지 */}
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
              <div className="score-milestones" style={{ marginBottom: 14 }}>
                <span>0</span>
                <span style={{ color: "var(--primary)", fontWeight: 700 }}>✓ 방장 가능 (80)</span>
                <span style={{ fontWeight: 700, color: "#a855f7" }}>VIP (95)</span>
                <span>100</span>
              </div>
              {/* 점수 획득 방법 가이드 */}
              <div className="score-guide">
                <b>점수 획득 방법</b><br />
                거래 완료 +5 · 좋은 후기(4-5점) +2<br />
                나쁜 후기(1-2점) -5 · 노쇼 -20
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, marginTop: 12 }}>내 최근 후기</div>
              {myReviews.slice(0, 4).map((rv) => (
                <div className="score-hist-item" key={rv.id}>
                  <span>{rv.comment || "후기 코멘트 없음"}</span>
                  <span className="score-up">{rv.rating}점</span>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", padding: "20px 0 8px", color: "var(--text-muted)", fontSize: 12 }}>
              반반마켓 v0.1 MVP · ⓒ 2025
            </div>
            {/* 로그아웃 버튼을 눈에 띄게 */}
            <button
              className="cancel-btn logout-btn"
              onClick={logout}
            >
              로그아웃
            </button>
          </>
        )}
      </div>

      {/* FAB 방 만들기 버튼 */}
      <button className={`fab ${fabHidden ? "hidden" : ""}`} onClick={handleFabClick}>＋ 방 만들기</button>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <button className={`nav-item ${page === "home" ? "active" : ""}`} onClick={() => setPage("home")}><div className="nav-icon">🏠</div>홈</button>
          <button className={`nav-item ${page === "search" ? "active" : ""}`} onClick={() => setPage("search")}><div className="nav-icon">🔍</div>탐색</button>
          <button className={`nav-item ${page === "trade" ? "active" : ""}`} onClick={handleTradeTabClick}><div className="nav-icon">📋</div>내 거래</button>
          <button className={`nav-item ${page === "my" ? "active" : ""}`} onClick={() => setPage("my")}><div className="nav-icon">👤</div>마이</button>
        </div>
      </nav>

      {/* 방 만들기 모달 */}
      <div className={`modal-overlay ${createOpen ? "open" : ""}`} onClick={(e) => e.target.classList.contains("modal-overlay") && setCreateOpen(false)}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-title">방 만들기</div>
          <div className="form-group">
            <label className="form-label">카테고리</label>
            <select className="form-select" value={createForm.category} onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value }))}>
              <option value="FOOD">🥩 식품</option>
              <option value="HOUSEHOLD">🧴 생활용품</option>
              <option value="BABY">🍼 육아</option>
              <option value="PET">🐾 반려동물</option>
              <option value="OTHER">📦 기타</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">상품명</label>
            <input className="form-input" value={createForm.title} onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))} placeholder="예) 코스트코 LA갈비" />
          </div>
          <div className="form-group">
            <label className="form-label">설명</label>
            <input className="form-input" value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} placeholder="간단한 상품 설명" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">총 수량</label>
              <input className="form-input" type="number" min="1" value={createForm.targetQuantity} onChange={(e) => setCreateForm((p) => ({ ...p, targetQuantity: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">단위</label>
              <input className="form-input" value={createForm.unit} onChange={(e) => setCreateForm((p) => ({ ...p, unit: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">총 가격 (원)</label>
            <input className="form-input" type="number" min="1" value={createForm.priceTotal} onChange={(e) => setCreateForm((p) => ({ ...p, priceTotal: e.target.value }))} />
            {/* 단위당 가격 실시간 미리보기 */}
            {createForm.priceTotal && createForm.targetQuantity && (
              <div style={{ fontSize: 12, color: "var(--primary)", marginTop: 4 }}>
                → {createForm.unit}당 약 {Math.round(Number(createForm.priceTotal) / Number(createForm.targetQuantity)).toLocaleString()}원
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">거래 장소</label>
            <KakaoLocationPicker
              locations={locations}
              selectedLocationId={createForm.meetingLocationId}
              selectedCustomLocation={
                !createForm.meetingLocationId && createForm.meetingLatitude && createForm.meetingLongitude
                  ? {
                      name: createForm.meetingLocationName,
                      address: createForm.meetingLocationAddress,
                      latitude: createForm.meetingLatitude,
                      longitude: createForm.meetingLongitude
                    }
                  : null
              }
              onSelectSaved={(locationId) => {
                const selected = locations.find((l) => String(l.id) === String(locationId));
                setCreateForm((p) => ({
                  ...p,
                  meetingLocationId: locationId,
                  meetingLocationName: selected?.name || "",
                  meetingLocationAddress: selected?.address || "",
                  meetingLatitude: selected?.latitude ?? "",
                  meetingLongitude: selected?.longitude ?? ""
                }));
              }}
              onSelectCustom={(place) => {
                setCreateForm((p) => ({
                  ...p,
                  meetingLocationId: "",
                  meetingLocationName: place.name,
                  meetingLocationAddress: place.address,
                  meetingLatitude: place.latitude,
                  meetingLongitude: place.longitude
                }));
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">만나는 시간</label>
            <div className="form-row date-time-row">
              <select
                className="form-select date-select"
                value={createForm.meetingDate}
                onChange={(e) => setCreateForm((p) => ({ ...p, meetingDate: e.target.value }))}
              >
                {createDateOptions.map((d) => <option key={`meet-${d.value}`} value={d.value}>{d.label}</option>)}
              </select>
              <input
                className="form-input time-input"
                type="time"
                value={createForm.meetingTime}
                onChange={(e) => setCreateForm((p) => ({ ...p, meetingTime: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">마감 시간</label>
            <div className="form-row date-time-row">
              <select
                className="form-select date-select"
                value={createForm.deadlineDate}
                onChange={(e) => setCreateForm((p) => ({ ...p, deadlineDate: e.target.value }))}
              >
                {createDateOptions.map((d) => <option key={`dead-${d.value}`} value={d.value}>{d.label}</option>)}
              </select>
              <input
                className="form-input time-input"
                type="time"
                value={createForm.deadlineTime}
                onChange={(e) => setCreateForm((p) => ({ ...p, deadlineTime: e.target.value }))}
              />
            </div>
          </div>
          <button className="submit-btn" onClick={submitCreateRoom}>방 생성하기</button>
          <button className="cancel-btn" onClick={() => setCreateOpen(false)}>취소</button>
        </div>
      </div>

      {/* 방 상세 모달 */}
      <div className={`modal-overlay ${detailOpen ? "open" : ""}`} onClick={(e) => e.target.classList.contains("modal-overlay") && setDetailOpen(false)}>
        <div className="modal" ref={detailModalRef}>
          {detailOpen && detailRoom && (
            <>
              <div className="modal-handle" />
              <div className="detail-hero">{catEmojis[detailRoom.category] || "📦"}</div>
              <div className="detail-title">{detailRoom.title}</div>
              <div className="progress-bg" style={{ marginBottom: 12 }}>
                <div className={`progress-fill ${(detailRoom.currentQuantity >= detailRoom.targetQuantity) ? "full" : ""}`} style={{ width: `${Math.min(100, (detailRoom.currentQuantity / detailRoom.targetQuantity) * 100)}%` }} />
              </div>
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
                <div className="participants-list">
                  {(detailRoom.participants || []).map((p) => (
                    <div key={p.userId} className={`participant-chip ${currentUser && p.userId === currentUser.id ? "participant-chip-me" : ""}`}>
                      {p.nickname}
                      {currentUser && p.userId === currentUser.id && <span style={{ marginLeft: 4, fontSize: 11, color: "var(--primary)", fontWeight: 700 }}>나 ✓</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* 참여 불가 이유 표시 */}
              {detailRoom.joinFailReason && (
                <div style={{ color: "#ea580c", fontSize: 13, marginBottom: 8, textAlign: "center", padding: "6px 0" }}>
                  ⚠️ {detailRoom.joinFailReason}
                </div>
              )}

              {detailRoom.canJoin ? (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">참여 수량</label>
                      <input className="form-input" type="number" min="1" value={joinQty} onChange={(e) => setJoinQty(e.target.value)} />
                    </div>
                  </div>
                  <button className="submit-btn" onClick={() => {
                    if (!loggedIn) { setDetailOpen(false); setAuthModalOpen(true); return; }
                    submitJoin(detailRoom.id);
                  }}>이 방에 참여하기</button>
                </>
              ) : (
                <button className="submit-btn" style={{ background: "var(--text-muted)", cursor: "default" }}>참여 불가</button>
              )}
              <button className="cancel-btn" onClick={() => setDetailOpen(false)}>닫기</button>
            </>
          )}
        </div>
      </div>

      {/* 참여자 목록 모달 */}
      <div className={`modal-overlay ${participantOpen ? "open" : ""}`} onClick={(e) => e.target.classList.contains("modal-overlay") && setParticipantOpen(false)}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-title">👥 참여자 목록 ({participantRoom?.participants?.length || 0}명)</div>
          {(participantRoom?.participants || []).map((p) => (
            <div className="participant-row" key={`p-${p.userId}`}>
              <div className="participant-avatar">👤</div>
              <div className="participant-info">
                <div className="participant-nick">{p.nickname}</div>
                <div className="participant-detail">신청 수량: {p.quantity} · 상태: {p.status}</div>
              </div>
            </div>
          ))}
          <button className="cancel-btn" onClick={() => setParticipantOpen(false)}>닫기</button>
        </div>
      </div>

      {/* 수령 체크 모달 */}
      <div className={`modal-overlay ${checkOpen ? "open" : ""}`} onClick={(e) => e.target.classList.contains("modal-overlay") && setCheckOpen(false)}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-title">수령 체크</div>
          <div className="chat-header" style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>{catEmojis[checkRoom?.category] || "📦"}</span>
            <div><div className="chat-room-name">{checkRoom?.title}</div><div className="chat-room-sub">{checkRoom?.meetingLocation?.name}</div></div>
          </div>
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

      {/* 후기 작성 모달 */}
      <div className={`modal-overlay ${reviewOpen ? "open" : ""}`} onClick={(e) => e.target.classList.contains("modal-overlay") && setReviewOpen(false)}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-title">⭐ 후기 작성</div>
          <div className="form-group">
            <label className="form-label">대상</label>
            <select className="form-select" value={reviewForm.revieweeId} onChange={(e) => {
              const selected = (reviewForm.targets || []).find((t) => String(t.userId) === e.target.value);
              setReviewForm((p) => ({ ...p, revieweeId: Number(e.target.value), type: selected?.type || p.type }));
            }}>
              {(reviewForm.targets || []).map((t) => <option key={t.userId} value={t.userId}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">거래 만족도</label>
            <div className="star-row">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} className={`star-btn ${reviewForm.rating >= s ? "on" : ""}`} onClick={() => setReviewForm((p) => ({ ...p, rating: s }))}>⭐</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">한 줄 후기</label>
            <input className="form-input" value={reviewForm.comment} onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))} placeholder="예) 시간도 잘 지키고 수량도 딱 맞았어요!" />
          </div>
          <button className="submit-btn" onClick={submitReview}>후기 제출하기</button>
          <button className="cancel-btn" onClick={() => setReviewOpen(false)}>취소</button>
        </div>
      </div>

      {/* 채팅 모달 */}
      <div className={`modal-overlay ${chatOpen ? "open" : ""}`} onClick={(e) => e.target.classList.contains("modal-overlay") && setChatOpen(false)}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="chat-header">
            <span style={{ fontSize: 28 }}>{catEmojis[chatRoom?.category] || "💬"}</span>
            <div className="chat-room-info"><div className="chat-room-name">{chatRoom?.title}</div><div className="chat-room-sub">{chatRoom?.meetingLocation?.name}</div></div>
          </div>
          <div className="chat-messages">
            {(chats[chatRoom?.id] || []).map((m, i) => (
              <div key={i} className={`chat-msg ${m.me ? "me" : ""}`}>
                <div className="chat-avatar">{m.avatar}</div>
                <div className="chat-bubble-wrap">
                  {!m.me && <div className="chat-nick">{m.nick}</div>}
                  <div className="chat-bubble">{m.text}</div>
                  <div className="chat-time">{m.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="chat-input-row">
            <input className="chat-input" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="메시지 입력..." />
            <button className="chat-send-btn" onClick={sendChat}>➤</button>
          </div>
          <button className="cancel-btn" onClick={() => setChatOpen(false)}>닫기</button>
        </div>
      </div>

      {/* 로그인/회원가입 모달 */}
      <div className={`modal-overlay ${authModalOpen ? "open" : ""}`} onClick={(e) => e.target.classList.contains("modal-overlay") && closeAuthModal()}>
        <div className="modal">
          <div className="modal-handle" />

          {/* 상단 탭 형태 전환 */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${authMode === "login" ? "active" : ""}`}
              onClick={() => { setAuthMode("login"); setAuthError(""); }}
            >
              로그인
            </button>
            <button
              className={`auth-tab ${authMode === "register" ? "active" : ""}`}
              onClick={() => { setAuthMode("register"); setAuthError(""); }}
            >
              회원가입
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">{authMode === "login" ? "아이디" : "이메일"}</label>
            <input
              className="form-input"
              type={authMode === "login" ? "text" : "email"}
              value={authForm.email}
              onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              placeholder={authMode === "login" ? "아이디를 입력하세요" : "이메일을 입력하세요"}
              autoComplete={authMode === "login" ? "username" : "email"}
            />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <div style={{ position: "relative" }}>
              <input
                className="form-input"
                type={showPassword ? "text" : "password"}
                value={authForm.password}
                onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                placeholder="비밀번호를 입력하세요"
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="pw-toggle-btn"
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          {authMode === "register" && (
            <div className="form-group">
              <label className="form-label">닉네임</label>
              <input
                className="form-input"
                value={authForm.nickname}
                onChange={(e) => setAuthForm((p) => ({ ...p, nickname: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                placeholder="닉네임을 입력하세요"
              />
            </div>
          )}

          {/* 에러 메시지 모달 내부 표시 */}
          {authError && (
            <div className="auth-error">
              {authError}
            </div>
          )}

          <button
            className="submit-btn"
            onClick={handleAuth}
            disabled={authLoading}
            style={authLoading ? { opacity: 0.7, cursor: "not-allowed" } : {}}
          >
            {authLoading ? "처리 중..." : authMode === "login" ? "로그인" : "가입하기"}
          </button>
          <button className="cancel-btn" onClick={closeAuthModal}>취소</button>
        </div>
      </div>

      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
    </>
  );
}

export default App;
