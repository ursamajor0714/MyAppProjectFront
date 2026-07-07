import { Platform, View, Text } from 'react-native';
import React from 'react';

// WebRTC 관련 브릿지 타입 선언
let exportRTCPeerConnection: any = null;
let exportRTCSessionDescription: any = null;
let exportRTCIceCandidate: any = null;
let exportMediaDevices: any = null;
let exportRTCView: any = null;

if (Platform.OS === 'web') {
  // ── A플랜 (Web 브라우저 표준 API) ──
  exportRTCPeerConnection = window.RTCPeerConnection || (window as any).webkitRTCPeerConnection;
  exportRTCSessionDescription = window.RTCSessionDescription || (window as any).webkitRTCSessionDescription;
  exportRTCIceCandidate = window.RTCIceCandidate || (window as any).webkitRTCIceCandidate;
  exportMediaDevices = navigator.mediaDevices;
  
  // Web에서는 표준 <video> 태그를 사용하므로 RTCView는 사용되지 않는 더미 뷰로 내보냄
  exportRTCView = ({ stream, ...props }: any) => {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff' }}>웹 환경에서는 HTML Video 태그를 사용합니다.</Text>
      </View>
    );
  };
} else {
  // ── B플랜 (Native react-native-webrtc 조건부 로딩) ──
  try {
    // react-native-webrtc가 설치되었을 때만 동적으로 가져옴 (추후 B플랜 전환 시 크래시 방지)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WebRTCModule = require('react-native-webrtc');
    exportRTCPeerConnection = WebRTCModule.RTCPeerConnection;
    exportRTCSessionDescription = WebRTCModule.RTCSessionDescription;
    exportRTCIceCandidate = WebRTCModule.RTCIceCandidate;
    exportMediaDevices = WebRTCModule.mediaDevices;
    exportRTCView = WebRTCModule.RTCView;
  } catch (error) {
    console.warn('⚠️ WebRTC Native 모듈이 로드되지 않았습니다. B플랜 실행을 위한 패키지 설치가 필요합니다.', error);

    // react-native-webrtc 패키지가 아직 미설치된 경우 크래시를 방지하기 위한 더미 클래스/컴포넌트
    exportRTCPeerConnection = class DummyPeerConnection {
      constructor() {
        console.warn('DummyPeerConnection: RTCPeerConnection is not available on native yet.');
      }
      close() {}
    };
    exportRTCSessionDescription = class DummySessionDescription {};
    exportRTCIceCandidate = class DummyIceCandidate {};
    exportMediaDevices = {
      getUserMedia: async () => {
        throw new Error('Native getUserMedia is unavailable. Please install react-native-webrtc.');
      }
    };
    exportRTCView = ({ stream, ...props }: any) => (
      <View style={[{ flex: 1, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' }, props.style]}>
        <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', padding: 20 }}>
          Native WebRTC 모드가 비활성화 상태입니다. (패키지 설치 및 개발자 빌드 필요)
        </Text>
      </View>
    );
  }
}

export {
  exportRTCPeerConnection as RTCPeerConnection,
  exportRTCSessionDescription as RTCSessionDescription,
  exportRTCIceCandidate as RTCIceCandidate,
  exportMediaDevices as mediaDevices,
  exportRTCView as RTCView
};
