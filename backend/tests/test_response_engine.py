"""
DefenXion – Automated Test Suite
=================================
Run with:  pytest backend/tests/ -v

Requires:  pip install pytest httpx pytest-asyncio
"""

import pytest
from unittest.mock import patch, MagicMock


# ---------------------------------------------------------------------------
# Response Engine tests (pure logic, no live DB required)
# ---------------------------------------------------------------------------

class TestAutomatedResponseLogic:
    """Unit tests for the response engine decision logic."""

    def _make_event(self, confidence: float, prediction: int = 1,
                    source_ip: str = "10.0.0.1") -> dict:
        from datetime import datetime
        return {
            "source_ip": source_ip,
            "destination_ip": "192.168.1.1",
            "prediction": prediction,
            "confidence": confidence,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

    @patch("backend.defenxion_response_engine.defense_settings_collection")
    @patch("backend.defenxion_response_engine.defense_modules_collection")
    @patch("backend.defenxion_response_engine._get_attack_count")
    def test_high_confidence_triggers_block(
        self, mock_count, mock_modules, mock_settings
    ):
        mock_settings.find_one.return_value = {"sensitivity": 80}
        mock_modules.find.return_value = []
        mock_count.return_value = 0

        from backend.defenxion_response_engine import automated_response
        action = automated_response(self._make_event(confidence=0.98))
        assert action == "BLOCK_IP"

    @patch("backend.defenxion_response_engine.defense_settings_collection")
    @patch("backend.defenxion_response_engine.defense_modules_collection")
    @patch("backend.defenxion_response_engine._get_attack_count")
    def test_repeated_high_confidence_triggers_critical_block(
        self, mock_count, mock_modules, mock_settings
    ):
        mock_settings.find_one.return_value = {"sensitivity": 80}
        mock_modules.find.return_value = []
        mock_count.return_value = 5  # repeat offender

        from backend.defenxion_response_engine import automated_response
        action = automated_response(self._make_event(confidence=0.98))
        assert action == "CRITICAL_BLOCK"

    @patch("backend.defenxion_response_engine.defense_settings_collection")
    @patch("backend.defenxion_response_engine.defense_modules_collection")
    @patch("backend.defenxion_response_engine._get_attack_count")
    def test_medium_confidence_triggers_alert(
        self, mock_count, mock_modules, mock_settings
    ):
        mock_settings.find_one.return_value = {"sensitivity": 80}
        mock_modules.find.return_value = []
        mock_count.return_value = 0

        from backend.defenxion_response_engine import automated_response
        action = automated_response(self._make_event(confidence=0.89))
        assert action == "ALERT_ADMIN"

    @patch("backend.defenxion_response_engine.defense_settings_collection")
    @patch("backend.defenxion_response_engine.defense_modules_collection")
    @patch("backend.defenxion_response_engine._get_attack_count")
    def test_low_confidence_logs_only(
        self, mock_count, mock_modules, mock_settings
    ):
        mock_settings.find_one.return_value = {"sensitivity": 80}
        mock_modules.find.return_value = []
        mock_count.return_value = 0

        from backend.defenxion_response_engine import automated_response
        action = automated_response(self._make_event(confidence=0.50))
        assert action == "LOG_ONLY"

    @patch("backend.defenxion_response_engine.defense_settings_collection")
    @patch("backend.defenxion_response_engine.defense_modules_collection")
    @patch("backend.defenxion_response_engine._get_attack_count")
    def test_auto_response_disabled_downgrades_block(
        self, mock_count, mock_modules, mock_settings
    ):
        mock_settings.find_one.return_value = {"sensitivity": 80}
        mock_modules.find.return_value = [
            {"name": "Auto-Response", "enabled": False}
        ]
        mock_count.return_value = 0

        from backend.defenxion_response_engine import automated_response
        action = automated_response(self._make_event(confidence=0.98))
        # Block should be downgraded to alert when Auto-Response is off
        assert action == "ALERT_ADMIN"


# ---------------------------------------------------------------------------
# Attack counter persistence tests
# ---------------------------------------------------------------------------

class TestAttackCounterPersistence:
    """Tests that attack counts are read from and written to MongoDB."""

    @patch("backend.defenxion_response_engine.logs_collection")
    def test_get_attack_count_reads_mongo(self, mock_logs):
        import backend.defenxion_response_engine as engine
        # Clear cache so it actually hits the DB
        engine._attack_counter_cache.clear()

        mock_logs.find_one.return_value = {"count": 7}
        count = engine._get_attack_count("10.0.0.42")
        assert count == 7
        mock_logs.find_one.assert_called_once()

    @patch("backend.defenxion_response_engine.logs_collection")
    def test_get_attack_count_returns_zero_if_no_record(self, mock_logs):
        import backend.defenxion_response_engine as engine
        engine._attack_counter_cache.clear()

        mock_logs.find_one.return_value = None
        count = engine._get_attack_count("10.0.0.99")
        assert count == 0

    @patch("backend.defenxion_response_engine.logs_collection")
    def test_update_history_upserts_to_mongo(self, mock_logs):
        import backend.defenxion_response_engine as engine
        engine._attack_counter_cache.clear()

        from datetime import datetime
        event = {
            "source_ip": "10.0.0.1",
            "prediction": 1,
            "confidence": 0.97,
            "destination_ip": "192.168.1.1",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
        engine.update_attack_history(event)
        mock_logs.update_one.assert_called_once()
        call_kwargs = mock_logs.update_one.call_args
        assert call_kwargs[1].get("upsert") is True
