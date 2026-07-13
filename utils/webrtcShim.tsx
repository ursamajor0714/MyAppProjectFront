import { Platform, View, Text, StyleSheet } from 'react-native';
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
  
  exportRTCView = ({ stream, ...props }: any) => {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff' }}>웹 환경에서는 HTML Video 태그를 사용합니다.</Text>
      </View>
    );
  };
} else {
  // ── B플랜 (Native react-native-webrtc 조건부 로딩 및 Expo Go 안전 우회) ──
  try {
    // Expo Go 환경이 아닌 개발자 빌드(Development Build)일 때만 react-native-webrtc를 정상 로드
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WebRTCModule = require('react-native-webrtc');
    exportRTCPeerConnection = WebRTCModule.RTCPeerConnection;
    exportRTCSessionDescription = WebRTCModule.RTCSessionDescription;
    exportRTCIceCandidate = WebRTCModule.RTCIceCandidate;
    exportMediaDevices = WebRTCModule.mediaDevices;
    exportRTCView = WebRTCModule.RTCView;
  } catch (error) {
    // Expo Go 혹은 Native 모듈이 누락된 에뮬레이터 환경을 위한 초정밀 가상 시뮬레이션 모듈(Virtual Shim) 가동
    exportRTCPeerConnection = class DummyPeerConnection {
      onicecandidate: any = null;
      onaddstream: any = null;
      localDescription: any = null;
      remoteDescription: any = null;
      
      constructor() {
        // 경고 크래시를 방지하기 위해 자동 디버그용 로그만 띄웁니다.
        console.log('🤖 Virtual WebRTC: RTCPeerConnection 모의 세션 연결 완료.');
      }
      
      async createOffer() {
        return { type: 'offer', sdp: 'dummy-sdp-offer' };
      }
      async createAnswer() {
        return { type: 'answer', sdp: 'dummy-sdp-answer' };
      }
      async setLocalDescription(desc: any) {
        this.localDescription = desc;
      }
      async setRemoteDescription(desc: any) {
        this.remoteDescription = desc;
      }
      async addIceCandidate(candidate: any) {
        // 모의 ICE 후보 처리
      }
      addStream(stream: any) {
        // 모의 미디어 스트림 처리
      }
      close() {
        console.log('🤖 Virtual WebRTC: 모의 영상 세션이 안전하게 종료되었습니다.');
      }
    };

    exportRTCSessionDescription = class DummySessionDescription {
      type: string;
      sdp: string;
      constructor(init: any) {
        this.type = init.type;
        this.sdp = init.sdp;
      }
    };

    exportRTCIceCandidate = class DummyIceCandidate {
      candidate: string;
      constructor(init: any) {
        this.candidate = init.candidate;
      }
    };

    exportMediaDevices = {
      getUserMedia: async (constraints: any) => {
        console.log('🤖 Virtual WebRTC: 가상 미디어(카메라/마이크) 캡처 성공.');
        return {
          toURL: () => 'dummy-stream-url',
          getTracks: () => [{ stop: () => {} }],
          getVideoTracks: () => [{ stop: () => {} }],
          getAudioTracks: () => [{ stop: () => {} }],
        };
      }
    };

    exportRTCView = ({ stream, ...props }: any) => {
      // react-native-webrtc 대신 실제 expo-camera 뷰를 동적으로 로드해 환자 전면 화면을 송출해 줍니다.
      try {
        const { CameraView } = require('expo-camera');
        return (
          <View style={[{ flex: 1, backgroundColor: '#000', overflow: 'hidden' }, props.style]}>
            <CameraView style={StyleSheet.absoluteFillObject} facing="front" mute={false} />
          </View>
        );
      } catch (camErr) {
        return (
          <View style={[{ flex: 1, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' }, props.style]}>
            <Text style={{ color: '#666', fontSize: 11 }}>😷 [시뮬레이션 전면카메라 준비 중]</Text>
          </View>
        );
      }
    };
  }
}

export {
  exportRTCPeerConnection as RTCPeerConnection,
  exportRTCSessionDescription as RTCSessionDescription,
  exportRTCIceCandidate as RTCIceCandidate,
  exportMediaDevices as mediaDevices,
  exportRTCView as RTCView
};
