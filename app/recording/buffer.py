from collections import deque


class FrameBuffer:
    def __init__(self, maxlen: int):
        self.buffer = deque(maxlen=maxlen)

    def append(self, frame):
        self.buffer.append(frame.copy())

    def snapshot(self):
        return list(self.buffer)

