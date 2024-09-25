// app.js

document.addEventListener('DOMContentLoaded', function() {

    // 지도 관련 변수들
    const mapContainer = document.getElementById('map'); // 지도를 표시할 div
    const mapOption = {
        center: new kakao.maps.LatLng(37.5665, 126.9780), // 초기 지도 중심좌표 (서울)
        level: 5 // 초기 지도 확대 레벨
    };

    // 지도를 생성합니다
    const map = new kakao.maps.Map(mapContainer, mapOption);

    // 장소 검색 객체를 생성합니다
    const ps = new kakao.maps.services.Places(); 

    // 마커들을 저장할 배열
    let markers = [];

    // 인포윈도우 객체를 전역 변수로 선언합니다
    let infowindow = null;

    // 마커 이미지의 주소
    const imageSrc = '/images/markerStar.png'; // 로컬에 저장한 이미지 파일 경로 또는 외부 URL

    // 마커 이미지의 크기
    const imageSize = new kakao.maps.Size(24, 35); // 마커 이미지의 크기 (가로, 세로)

    // 마커 이미지를 생성합니다
    const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

    // 현재 위치를 저장할 변수
    let currentPosition = null;

    // 검색 폼 요소 가져오기
    const searchForm = document.getElementById('searchForm');
    const keywordInput = document.getElementById('keyword');
    const radiusSelect = document.getElementById('radius');

    // 검색 폼 이벤트 리스너 추가
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const keyword = keywordInput.value.trim();
        const radius = parseInt(radiusSelect.value);

        if (!keyword) {
            alert('검색어를 입력하세요.');
            return;
        }

        // 사용자 위치가 있는 경우 해당 위치에서 검색
        if (currentPosition) {
            searchPlaces(currentPosition, keyword, radius);
        } else {
            alert('사용자 위치를 가져올 수 없습니다.');
        }
    });

    // 초기 검색 실행 함수
    function initializeSearch() {
        const initialKeyword = keywordInput.value.trim();
        const initialRadius = parseInt(radiusSelect.value);
        searchPlaces(currentPosition, initialKeyword, initialRadius);
    }

    // HTML5의 Geolocation을 사용하여 사용자 위치를 얻어옵니다
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude; // 위도
            const lon = position.coords.longitude; // 경도

            currentPosition = new kakao.maps.LatLng(lat, lon); // 사용자 위치 저장

            // 지도 중심을 사용자 위치로 이동합니다
            map.setCenter(currentPosition);

            // 사용자 위치에 마커를 표시합니다
            const userMarker = new kakao.maps.Marker({
                map: map,
                position: currentPosition,
                title: '현재 위치',
                image: markerImage // 마커 이미지 적용
            });

            // 초기 검색 실행
            initializeSearch();

        }, function(error) {
            console.error(error);
            alert('위치 정보를 가져오는데 실패했습니다.');

            // Geolocation 실패 시 기본 위치 사용
            currentPosition = new kakao.maps.LatLng(37.5665, 126.9780); // 서울 좌표
            map.setCenter(currentPosition);
            initializeSearch();
        });
    } else {
        // Geolocation을 사용할 수 없을 때 기본 위치를 사용합니다
        currentPosition = new kakao.maps.LatLng(37.5665, 126.9780); // 서울 좌표
        alert('Geolocation을 사용할 수 없습니다.');

        // 지도 중심을 기본 위치로 이동합니다
        map.setCenter(currentPosition);

        // 초기 검색 실행
        initializeSearch();
    }

    // 장소 검색 함수
    function searchPlaces(locPosition, keyword, radius) {
        const callback = function(result, status, pagination) {
            if (status === kakao.maps.services.Status.OK) {
                // 결과를 처리하는 함수 호출
                displayPlaces(result);
            } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
                alert('검색 결과가 없습니다.');
            } else if (status === kakao.maps.services.Status.ERROR) {
                alert('검색 중 오류가 발생했습니다.');
            }
        };

        const options = {
            location: locPosition,
            radius: radius,
            sort: kakao.maps.services.SortBy.DISTANCE
        };

        ps.keywordSearch(keyword, callback, options);
    }

    // 검색 결과 목록과 마커를 표시하는 함수
    function displayPlaces(places) {
        const listEl = document.getElementById('placesList');
        const bounds = new kakao.maps.LatLngBounds();

        // 기존에 표시된 마커와 목록을 초기화합니다
        removeMarkers();
        listEl.innerHTML = '';

        for (let i = 0; i < places.length; i++) {
            const place = places[i];
            const placePosition = new kakao.maps.LatLng(place.y, place.x);

            // 마커를 생성하고 지도에 표시합니다
            const marker = addMarker(placePosition);

            // 목록 아이템을 생성합니다
            const itemEl = createListItem(i, place);

            // 마커와 목록 아이템에 이벤트를 등록합니다
            kakao.maps.event.addListener(marker, 'click', function() {
                displayInfowindow(marker, place);
            });

            itemEl.onclick = function() {
                map.setCenter(marker.getPosition());
                displayInfowindow(marker, place);
            };

            // 목록에 아이템을 추가합니다
            listEl.appendChild(itemEl);

            // 지도 범위를 확장합니다
            bounds.extend(placePosition);
        }

        // 지도 범위를 재설정합니다
        map.setBounds(bounds);
    }

    // 목록 아이템을 생성하는 함수
    function createListItem(index, place) {
        const el = document.createElement('div');
        el.className = 'place-item';

        let itemStr = `
            <div class="place-name">${place.place_name}</div>
            <div class="place-address">${place.road_address_name || place.address_name}</div>
        `;

        if (place.phone) {
            itemStr += `<div class="place-phone">${place.phone}</div>`;
        } else {
            itemStr += `<div class="place-phone">전화번호 정보 없음</div>`;
        }

        el.innerHTML = itemStr;
        return el;
    }

    // 마커를 생성하고 지도 위에 표시하는 함수
    function addMarker(position) {
        const marker = new kakao.maps.Marker({
            position: position,
            map: map
        });

        markers.push(marker);
        return marker;
    }

    // 인포윈도우를 표시하는 함수
    function displayInfowindow(marker, place) {
        const content = '<div style="padding:5px;font-size:12px;">' + place.place_name + '</div>';

        // 기존에 열려있는 인포윈도우를 닫습니다
        if (infowindow) {
            infowindow.close();
        }

        // 인포윈도우를 생성하고 마커 위에 표시합니다
        infowindow = new kakao.maps.InfoWindow({
            content: content,
            removable: true
        });
        infowindow.open(map, marker);
    }

    // 마커를 모두 제거하는 함수
    function removeMarkers() {
        for (let i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers = [];
    }

    // 윈도우 리사이즈 시 지도 크기 재설정
    window.addEventListener('resize', function() {
        map.relayout();
    });

});
