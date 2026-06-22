/* =====================================================================
   CONDOSPHERE - Intercomunicador Online (WebRTC + Supabase Realtime)
   Chamadas de áudio P2P gratuitas entre Portaria, Admin e Moradores
   ===================================================================== */

const IntercomEngine = (function() {
    const STUN_SERVERS = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' }
        ]
    };

    let peerConnection = null;
    let localStream = null;
    let remoteStream = null;
    let audioElement = null;
    let currentCallId = null;
    let isInitiator = false;

    function getLocalStream() {
        return navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 48000
            },
            video: false
        });
    }

    function createPeerConnection(channel) {
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }

        peerConnection = new RTCPeerConnection(STUN_SERVERS);

        peerConnection.onicecandidate = (event) => {
            if (event.candidate && channel && currentCallId) {
                channel.send({
                    type: 'broadcast',
                    event: 'ice-candidate',
                    payload: {
                        callId: currentCallId,
                        candidate: event.candidate.toJSON(),
                        from: getMyName()
                    }
                });
            }
        };

        peerConnection.ontrack = (event) => {
            remoteStream = event.streams[0];
            if (!audioElement) {
                audioElement = document.createElement('audio');
                audioElement.autoplay = true;
                audioElement.style.display = 'none';
                document.body.appendChild(audioElement);
            }
            audioElement.srcObject = remoteStream;
        };

        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState;
            if (state === 'connected') {
                console.log('[WEBRTC] Conexao P2P estabelecida!');
            } else if (state === 'failed' || state === 'disconnected') {
                console.warn('[WEBRTC] Conexao perdida:', state);
            }
        };

        return peerConnection;
    }

    function getMyName() {
        try {
            const cached = SafeStorage.getItem('currentUser');
            return cached ? JSON.parse(cached).name : 'Unknown';
        } catch (e) { return 'Unknown'; }
    }

    function getMyRole() {
        try {
            const cached = SafeStorage.getItem('currentUser');
            return cached ? JSON.parse(cached).role : 'Unknown';
        } catch (e) { return 'Unknown'; }
    }

    return {
        async initiateCall(channel, targetName, callId) {
            try {
                currentCallId = callId;
                isInitiator = true;

                localStream = await getLocalStream();
                const pc = createPeerConnection(channel);

                localStream.getTracks().forEach(track => {
                    pc.addTrack(track, localStream);
                });

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                channel.send({
                    type: 'broadcast',
                    event: 'webrtc-offer',
                    payload: {
                        callId: callId,
                        offer: pc.localDescription.toJSON(),
                        from: getMyName(),
                        fromRole: getMyRole(),
                        to: targetName
                    }
                });

                console.log('[WEBRTC] Offer enviada para', targetName);
                return true;
            } catch (err) {
                console.error('[WEBRTC] Erro ao iniciar chamada:', err);
                return false;
            }
        },

        async handleOffer(channel, payload) {
            try {
                currentCallId = payload.callId;
                isInitiator = false;

                localStream = await getLocalStream();
                const pc = createPeerConnection(channel);

                localStream.getTracks().forEach(track => {
                    pc.addTrack(track, localStream);
                });

                await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                channel.send({
                    type: 'broadcast',
                    event: 'webrtc-answer',
                    payload: {
                        callId: payload.callId,
                        answer: pc.localDescription.toJSON(),
                        from: getMyName()
                    }
                });

                console.log('[WEBRTC] Answer enviada para', payload.from);
                return true;
            } catch (err) {
                console.error('[WEBRTC] Erro ao responder chamada:', err);
                return false;
            }
        },

        async handleAnswer(payload) {
            try {
                if (peerConnection && payload.answer) {
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.answer));
                    console.log('[WEBRTC] Resposta recebida, conexao P2P pronta');
                }
            } catch (err) {
                console.error('[WEBRTC] Erro ao processar resposta:', err);
            }
        },

        handleIceCandidate(payload) {
            try {
                if (peerConnection && payload.candidate) {
                    peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
                }
            } catch (err) {
                console.warn('[WEBRTC] Erro ao adicionar ICE candidate:', err);
            }
        },

        endCall() {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                localStream = null;
            }
            if (peerConnection) {
                peerConnection.close();
                peerConnection = null;
            }
            if (audioElement) {
                audioElement.srcObject = null;
            }
            remoteStream = null;
            currentCallId = null;
            isInitiator = false;
            console.log('[WEBRTC] Chamada encerrada');
        },

        isCallActive() {
            return peerConnection && peerConnection.connectionState === 'connected';
        },

        getCurrentCallId() {
            return currentCallId;
        },

        getLocalStream() {
            return localStream;
        }
    };
})();

if (typeof window !== 'undefined') {
    window.IntercomEngine = IntercomEngine;
}
