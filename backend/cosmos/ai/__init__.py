"""CosmOS AI: the AI Scientist and What-If reasoning engines."""

from .scientist import AIScientist, Diagnosis
from .whatif import Comparison, compare, parse_what_if

__all__ = ["AIScientist", "Diagnosis", "Comparison", "compare", "parse_what_if"]
