import uuid

from sqlalchemy import Column, DateTime, func, VARCHAR, Integer, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID, INTERVAL, ARRAY
from sqlalchemy.ext.mutable import Mutable
from sqlalchemy.orm import relationship

from database.database import Base


class User(Base):
    __tablename__ = 'user'

    id = Column(BigInteger, primary_key=True, unique=True, nullable=False)
    name = Column(VARCHAR(255), nullable=False)
    timezone = Column(Integer, nullable=False)
    notification_time = Column(ARRAY(Integer), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(),
                        server_onupdate=func.now())

    schedule = relationship('Schedule', uselist=False, lazy='immediate', back_populates='user')


class Schedule(Base):
    __tablename__ = 'schedule'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    user_id = Column(BigInteger, ForeignKey(User.id), nullable=False)
    windows = Column(ARRAY(Integer), nullable=False)

    user = relationship(User, uselist=False, lazy='immediate', back_populates='schedule')


class CalendarEvent(Base):
    __tablename__ = 'calendar_event'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    owner_user_id = Column(BigInteger, ForeignKey(User.id), nullable=False)
    invited_user_id = Column(BigInteger, ForeignKey(User.id), nullable=False)
    appointment_time = Column(DateTime, nullable=False)
    duration = Column(INTERVAL, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(),
                        server_onupdate=func.now())

    owner_user = relationship(User, uselist=False, foreign_keys=[owner_user_id], lazy='immediate', viewonly=True)
    invited_user = relationship(User, uselist=False, foreign_keys=[invited_user_id], lazy='immediate', viewonly=True)
