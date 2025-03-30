"use client"

import { useState, useRef, useEffect } from "react"

// ----------------------------------------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------------------------------------

// Generate a random values in the range {min, max}
function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

// Calculate if an attack is a critical hit (20% chance)
function isCriticalHit() {
  return Math.random() < 0.2
}

// Create an attack log
function createLogAttack(isPlayer, damage, isCritical) {
  return {
    isPlayer: isPlayer,
    isDamage: true,
    isCritical: isCritical,
    text: ` takes ${damage} damage${isCritical ? " (CRITICAL HIT!)" : ""}`,
  }
}

// Create a healing log
function createLogHeal(healing, isMaxed) {
  return {
    isPlayer: true,
    isDamage: false,
    text: ` heals ${healing} life points${isMaxed ? " (MAX HEALTH!)" : ""}`,
  }
}

function Game() {
  // ----------------------------------------------------------------------------------------------------------
  // STATES & VARIABLES
  // ----------------------------------------------------------------------------------------------------------
  const [playerHealth, setPlayerHealth] = useState(100)
  const [monsterHealth, setMonsterHealth] = useState(100)
  const [currentRound, setCurrentRound] = useState(0)
  const [battleLog, setBattleLog] = useState([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [specialAttackAvailable, setSpecialAttackAvailable] = useState(true)
  const [specialAttackCooldown, setSpecialAttackCooldown] = useState(0)
  const [lastActionWasCritical, setLastActionWasCritical] = useState(false)
  const [gameStats, setGameStats] = useState({
    playerDamageDealt: 0,
    monsterDamageDealt: 0,
    healingDone: 0,
    criticalHits: 0,
    roundsPlayed: 0,
  })

  // Constants for game mechanics
  const ATTACK_MIN_DAMAGE = 5
  const ATTACK_MAX_DAMAGE = 12
  const SPECIAL_ATTACK_MIN_DAMAGE = 10
  const SPECIAL_ATTACK_MAX_DAMAGE = 20
  const MONSTER_ATTACK_MIN_DAMAGE = 8
  const MONSTER_ATTACK_MAX_DAMAGE = 15
  const HEAL_MIN_VALUE = 8
  const HEAL_MAX_VALUE = 20
  const SPECIAL_ATTACK_COOLDOWN = 3
  const CRITICAL_HIT_MULTIPLIER = 1.5

  // Ref for scrolling battle log
  const logContainerRef = useRef(null)

  // ----------------------------------------------------------------------------------------------------------
  // EFFECTS
  // ----------------------------------------------------------------------------------------------------------

  // Scroll battle log to bottom when new entries are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0
    }
  }, [battleLog])

  // Handle special attack cooldown
  useEffect(() => {
    if (specialAttackCooldown > 0) {
      setSpecialAttackAvailable(false)
    } else {
      setSpecialAttackAvailable(true)
    }
  }, [specialAttackCooldown])

  // Check for winner whenever health changes
  useEffect(() => {
    checkForWinner()
  }, [playerHealth, monsterHealth])

  // ----------------------------------------------------------------------------------------------------------
  // BUTTONS EVENT FUNCTIONS
  // ----------------------------------------------------------------------------------------------------------
  const attackMonster = () => {
    // Don't allow actions if game is over
    if (gameOver || playerHealth <= 0 || monsterHealth <= 0) {
      return
    }

    setCurrentRound((prevRound) => prevRound + 1)

    // Check for critical hit
    const critical = isCriticalHit()
    let damage = getRandomValue(ATTACK_MIN_DAMAGE, ATTACK_MAX_DAMAGE)

    // Apply critical hit multiplier if applicable
    if (critical) {
      damage = Math.floor(damage * CRITICAL_HIT_MULTIPLIER)
      setLastActionWasCritical(true)
      setGameStats((prev) => ({
        ...prev,
        criticalHits: prev.criticalHits + 1,
      }))
    } else {
      setLastActionWasCritical(false)
    }

    // Calculate new monster health
    const newMonsterHealth = Math.max(monsterHealth - damage, 0)
    setMonsterHealth(newMonsterHealth)

    // Update stats
    setGameStats((prev) => ({
      ...prev,
      playerDamageDealt: prev.playerDamageDealt + damage,
      roundsPlayed: prev.roundsPlayed + 1,
    }))

    // Add to battle log
    addLogMessage(createLogAttack(true, damage, critical))

    // Reduce special attack cooldown if active
    if (specialAttackCooldown > 0) {
      setSpecialAttackCooldown((prev) => prev - 1)
    }

    // If monster is not defeated, it's monster's turn
    if (newMonsterHealth > 0) {
      monsterAttack()
    }
  }

  const specialAttackMonster = () => {
    // Don't allow actions if game is over
    if (gameOver || playerHealth <= 0 || monsterHealth <= 0 || !specialAttackAvailable) {
      return
    }

    setCurrentRound((prevRound) => prevRound + 1)

    // Check for critical hit
    const critical = isCriticalHit()
    let damage = getRandomValue(SPECIAL_ATTACK_MIN_DAMAGE, SPECIAL_ATTACK_MAX_DAMAGE)

    // Apply critical hit multiplier if applicable
    if (critical) {
      damage = Math.floor(damage * CRITICAL_HIT_MULTIPLIER)
      setLastActionWasCritical(true)
      setGameStats((prev) => ({
        ...prev,
        criticalHits: prev.criticalHits + 1,
      }))
    } else {
      setLastActionWasCritical(false)
    }

    // Calculate new monster health
    const newMonsterHealth = Math.max(monsterHealth - damage, 0)
    setMonsterHealth(newMonsterHealth)

    // Update stats
    setGameStats((prev) => ({
      ...prev,
      playerDamageDealt: prev.playerDamageDealt + damage,
      roundsPlayed: prev.roundsPlayed + 1,
    }))

    // Add to battle log
    addLogMessage(createLogAttack(true, damage, critical))

    // Set cooldown
    setSpecialAttackCooldown(SPECIAL_ATTACK_COOLDOWN)
    setSpecialAttackAvailable(false)

    // If monster is not defeated, it's monster's turn
    if (newMonsterHealth > 0) {
      monsterAttack()
    }
  }

  const healPlayer = () => {
    // Don't allow actions if game is over
    if (gameOver || playerHealth <= 0 || monsterHealth <= 0 || playerHealth === 100) {
      return
    }

    setCurrentRound((prevRound) => prevRound + 1)
    const healing = getRandomValue(HEAL_MIN_VALUE, HEAL_MAX_VALUE)
    const isMaxed = playerHealth + healing >= 100

    // Don't heal beyond 100
    const newPlayerHealth = Math.min(playerHealth + healing, 100)
    setPlayerHealth(newPlayerHealth)

    // Update stats
    setGameStats((prev) => ({
      ...prev,
      healingDone: prev.healingDone + (isMaxed ? 100 - playerHealth : healing),
      roundsPlayed: prev.roundsPlayed + 1,
    }))

    // Add to battle log
    addLogMessage(createLogHeal(healing, isMaxed))

    // Reduce special attack cooldown if active
    if (specialAttackCooldown > 0) {
      setSpecialAttackCooldown((prev) => prev - 1)
    }

    // Monster's turn
    monsterAttack()
  }

  const surrender = () => {
    // Don't allow surrender if game is already over
    if (gameOver) {
      return
    }

    setPlayerHealth(0)
    setWinner("monster")
    setGameOver(true)
    addLogMessage({
      isPlayer: true,
      isDamage: false,
      text: " surrendered to the monster!",
    })
  }

  const resetGame = () => {
    setPlayerHealth(100)
    setMonsterHealth(100)
    setCurrentRound(0)
    setBattleLog([])
    setGameOver(false)
    setWinner(null)
    setSpecialAttackAvailable(true)
    setSpecialAttackCooldown(0)
    setLastActionWasCritical(false)
    setGameStats({
      playerDamageDealt: 0,
      monsterDamageDealt: 0,
      healingDone: 0,
      criticalHits: 0,
      roundsPlayed: 0,
    })
  }

  const monsterAttack = () => {
    // Don't allow monster attack if game is over
    if (gameOver || playerHealth <= 0 || monsterHealth <= 0) {
      return
    }

    // Check for critical hit
    const critical = isCriticalHit()
    let damage = getRandomValue(MONSTER_ATTACK_MIN_DAMAGE, MONSTER_ATTACK_MAX_DAMAGE)

    // Apply critical hit multiplier if applicable
    if (critical) {
      damage = Math.floor(damage * CRITICAL_HIT_MULTIPLIER)
    }

    // Calculate new health
    const newHealth = Math.max(playerHealth - damage, 0)
    setPlayerHealth(newHealth)

    // Update stats
    setGameStats((prev) => ({
      ...prev,
      monsterDamageDealt: prev.monsterDamageDealt + damage,
    }))

    // Add to battle log
    addLogMessage(createLogAttack(false, damage, critical))
  }

  const checkForWinner = () => {
    if (monsterHealth <= 0 && playerHealth <= 0) {
      // It's a draw
      setWinner("draw")
      setGameOver(true)
    } else if (monsterHealth <= 0) {
      // Player wins
      setWinner("player")
      setGameOver(true)
    } else if (playerHealth <= 0) {
      // Monster wins
      setWinner("monster")
      setGameOver(true)
    }
  }

  const addLogMessage = (logEntry) => {
    setBattleLog((prevLog) => [logEntry, ...prevLog])
  }

  // ----------------------------------------------------------------------------------------------------------
  // JSX FUNCTIONS
  // ----------------------------------------------------------------------------------------------------------
  const renderHealthBars = () => {
    return (
      <section id="healthbars">
        <div className="container player-health">
          <h2>Your Health</h2>
          <div className="healthbar">
            <div
              className="healthbar__value"
              style={{
                width: `${playerHealth}%`,
                backgroundColor: playerHealth < 25 ? "#e74c3c" : playerHealth < 50 ? "#f39c12" : "#2ecc71",
              }}
            ></div>
          </div>
          <div className="health-text">{playerHealth}/100</div>
        </div>
        <div className="container monster-health">
          <h2>Monster Health</h2>
          <div className="healthbar">
            <div
              className="healthbar__value"
              style={{
                width: `${monsterHealth}%`,
                backgroundColor: monsterHealth < 25 ? "#e74c3c" : monsterHealth < 50 ? "#f39c12" : "#e74c3c",
              }}
            ></div>
          </div>
          <div className="health-text">{monsterHealth}/100</div>
        </div>
      </section>
    )
  }

  const renderControls = () => {
    return (
      <section id="controls" className="container">
        <button className="btn-attack" onClick={attackMonster} disabled={gameOver || playerHealth <= 0 || monsterHealth <= 0}>
          ATTACK
        </button>
        <button 
          className="btn-special" 
          onClick={specialAttackMonster} 
          disabled={gameOver || !specialAttackAvailable || playerHealth <= 0 || monsterHealth <= 0}
        >
          SPECIAL ATTACK {!specialAttackAvailable && `(${specialAttackCooldown})`}
        </button>
        <button 
          className="btn-heal" 
          onClick={healPlayer} 
          disabled={gameOver || playerHealth === 100 || playerHealth <= 0 || monsterHealth <= 0}
        >
          HEAL
        </button>
        <button className="btn-surrender" onClick={surrender} disabled={gameOver || playerHealth <= 0 || monsterHealth <= 0}>
          SURRENDER
        </button>
        {gameOver && (
          <button className="btn-reset" onClick={resetGame}>
            START NEW GAME
          </button>
        )}
      </section>
    )
  }

  const renderBattleLog = () => {
    return (
      <section id="log" className="container" ref={logContainerRef}>
        <h2>Battle Log</h2>
        <ul>
          {battleLog.map((log, index) => (
            <li
              key={index}
              className={`
                ${log.isPlayer ? "log--player" : "log--monster"} 
                ${log.isDamage ? "log--damage" : "log--heal"}
                ${log.isCritical ? "critical-hit" : ""}
              `}
            >
              {log.isPlayer ? "Player" : "Monster"}
              {log.text}
            </li>
          ))}
        </ul>
      </section>
    )
  }

  const renderGameOver = () => {
    if (!gameOver) return null

    let message = ""
    let winnerClass = ""

    if (winner === "player") {
      message = "You won!"
      winnerClass = "winner-player"
    } else if (winner === "monster") {
      message = "You lost!"
      winnerClass = "winner-monster"
    } else {
      message = "It's a draw!"
      winnerClass = "winner-draw"
    }

    return (
      <section className="container game-over">
        <h2>Game Over!</h2>
        <h3 className={winnerClass}>{message}</h3>
        <div className="game-stats">
          <p>Rounds played: {gameStats.roundsPlayed}</p>
          <p>Damage dealt to monster: {gameStats.playerDamageDealt}</p>
          <p>Damage taken: {gameStats.monsterDamageDealt}</p>
          <p>Healing done: {gameStats.healingDone}</p>
          <p>Critical hits: {gameStats.criticalHits}</p>
        </div>
      </section>
    )
  }

  // ----------------------------------------------------------------------------------------------------------
  // MAIN TEMPLATE
  // ----------------------------------------------------------------------------------------------------------
  return (
    <>
      {renderHealthBars()}
      {gameOver && renderGameOver()}
      {renderControls()}
      {renderBattleLog()}
    </>
  )
}

export default Game