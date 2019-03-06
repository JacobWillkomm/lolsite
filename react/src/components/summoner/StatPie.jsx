import React, { Component } from 'react'
import PropTypes from 'prop-types'
import numeral from 'numeral'
import {
    PieChart, Pie, Tooltip
} from 'recharts'


class StatPie extends Component {
    constructor(props) {
        super(props)
        this.state = {}

        this.getMyTeam = this.getMyTeam.bind(this)
        this.getAvgDPG = this.getAvgDPG.bind(this)
        this.getMaxDPG = this.getMaxDPG.bind(this)
        this.getData = this.getData.bind(this)
        this.getDPM = this.getDPM.bind(this)
        this.getAVGTotalDamageTaken = this.getAVGTotalDamageTaken.bind(this)
        this.getMaxDamageTaken = this.getMaxDamageTaken.bind(this)
        this.getMaxVisionScore = this.getMaxVisionScore.bind(this)
    }
    
    getMyTeam() {
        // not including myself
        var myteam = []
        var team_id = this.props.mypart.team_id
        for (var part of this.props.match.participants) {
            if (team_id === part.team_id) {
                if (part.account_id !== this.props.mypart.account_id) {
                    myteam.push(part)
                }
            }
        }
        return myteam
    }
    getDPM(part) {
        var seconds = this.props.match.game_duration
        var minutes = seconds / 60
        var dmg_to_champs = part.stats.total_damage_dealt_to_champions
        var dpm
        try {
            dpm = dmg_to_champs / minutes
        }
        catch(error) {
            dpm = 0
        }
        return dpm
    }
    getDPG(part) {
        var gold = part.stats.gold_earned
        var dmg_to_champs = part.stats.total_damage_dealt_to_champions
        var dpg
        try {
            dpg = dmg_to_champs / gold
        }
        catch(error) {
            dpg = 0
        }
        return dpg
    }
    getAvgDPG(myteam) {
        // excluding my dpg
        var total = 0
        for (var part of myteam) {
            total += this.getDPG(part)
        }
        var avg
        try {
            avg = total / myteam.length
        }
        catch(error) {
            avg = 0
        }
        return avg
    }
    getMaxDPG(myteam) {
        var max = 0
        var val
        for (var part of [this.props.mypart, ...myteam]) {
            val = this.getDPG(part)
            if (val > max) {
                max = val
            }
        }
        return max
    }
    getAvgVisionScore(myteam) {
        var total = 0
        for (var part of myteam) {
            total += part.stats.vision_score
        }
        var avg
        try {
            avg = total / myteam.length
        }
        catch(error) {
            avg = 0
        }
        return avg
    }
    getMaxVisionScore(myteam) {
        var max = 0
        var val
        for (var part of [this.props.mypart, ...myteam]) {
            val = part.stats.vision_score
            if (val > max) {
                max = val
            }
        }
        return max
    }
    getAVGTotalDamageTaken(myteam) {
        var total = 0
        for (var part of myteam) {
            total += part.stats.total_damage_taken
        }
        var avg
        try {
            avg = total / myteam.length
        }
        catch(error) {
            avg = 0
        }
        return avg
    }
    getMaxDamageTaken(myteam) {
        var max = 0
        var val
        for (var part of [this.props.mypart, ...myteam]) {
            val = part.stats.total_damage_taken
            if (val > max) {
                max = val
            }
        }
        return max
    }
    getData() {
        var myteam = this.getMyTeam()
        
        var dpm = this.getDPM(this.props.mypart)

        var dpg = this.getDPG(this.props.mypart)
        var avg_dpg = this.getAvgDPG(myteam)
        var max_dpg = this.getMaxDPG(myteam)

        var vision_score = this.props.mypart.stats.vision_score
        var avg_vision_score = this.getAvgVisionScore(myteam)
        var max_vision_score = this.getMaxVisionScore(myteam)

        var total_damage_taken = this.props.mypart.stats.total_damage_taken
        var avg_total_damage_taken = this.getAVGTotalDamageTaken(myteam)
        var max_total_damage_taken = this.getMaxDamageTaken(myteam)

        var data = {
            vision_score: [{name: 'Vision Score', value: vision_score}],
            avg_vision_score: [{name: 'AVG Vision Score', value: avg_vision_score}],
            max_vision_score: max_vision_score,

            dpm: [{name: 'DPM', value: dpm}],

            dpg: [{name: 'DPG', value: dpg}],
            avg_dpg: [{name: 'AVG DPG', value: avg_dpg}],
            max_dpg: max_dpg,

            total_damage_taken: [{name: 'Damage Taken', value: total_damage_taken}],
            avg_total_damage_taken: [{name: 'AVG Damage Taken', value: avg_total_damage_taken}],
            max_total_damage_taken: max_total_damage_taken,
        }
        return data
    }
    getEndAngle(stat, max) {
        var frac = stat / max
        var angle = 180 - (180 * frac)
        return angle
    }
    render() {
        let data = this.getData()
        let start_angle = 180
        let cx = 130
        let cy = 100
        let animation = false
        let stroke = '#999'
        let avg_color = '#5f5f5f'
        return (
            <PieChart width={this.props.width} height={this.props.height}>

                {/* DAMAGE PER GOLD */}
                <Pie
                    isAnimationActive={animation}
                    cx={cx}
                    cy={cy}
                    startAngle={start_angle}
                    endAngle={this.getEndAngle(data.dpg[0].value, data.max_dpg)}
                    data={data.dpg}
                    dataKey='value'
                    outerRadius={90}
                    innerRadius={80}
                    stroke={stroke}
                    fill="#cec66b"/>
                <Pie
                    isAnimationActive={animation}
                    cx={cx}
                    cy={cy}
                    startAngle={start_angle}
                    endAngle={this.getEndAngle(data.avg_dpg[0].value, data.max_dpg)}
                    data={data.avg_dpg}
                    dataKey='value'
                    outerRadius={80}
                    innerRadius={75}
                    stroke={stroke}
                    fill={avg_color}/>

                {/* VISION SCORE */}
                <Pie
                    isAnimationActive={animation}
                    cx={cx}
                    cy={cy}
                    startAngle={start_angle}
                    endAngle={this.getEndAngle(data.vision_score[0].value, data.max_vision_score)}
                    data={data.vision_score}
                    dataKey='value'
                    outerRadius={65}
                    innerRadius={55}
                    stroke={stroke}
                    fill="#4b9bcd"/>
                <Pie
                    isAnimationActive={animation}
                    cx={cx}
                    cy={cy}
                    startAngle={start_angle}
                    endAngle={this.getEndAngle(data.avg_vision_score[0].value, data.max_vision_score)}
                    data={data.avg_vision_score}
                    dataKey='value'
                    outerRadius={55}
                    innerRadius={50}
                    stroke={stroke}
                    fill={avg_color}/>

                {/* DAMAGE TAKEN */}
                <Pie
                    isAnimationActive={animation}
                    cx={cx}
                    cy={cy}
                    startAngle={start_angle}
                    endAngle={this.getEndAngle(data.total_damage_taken[0].value, data.max_total_damage_taken)}
                    data={data.total_damage_taken}
                    dataKey='value'
                    outerRadius={40}
                    innerRadius={30}
                    stroke={stroke}
                    fill="#a2b6c1"/>
                <Pie
                    isAnimationActive={animation}
                    cx={cx}
                    cy={cy}
                    startAngle={start_angle}
                    endAngle={this.getEndAngle(data.avg_total_damage_taken[0].value, data.max_total_damage_taken)}
                    data={data.avg_total_damage_taken}
                    dataKey='value'
                    outerRadius={30}
                    innerRadius={25}
                    stroke={stroke}
                    fill={avg_color}/>

                <Tooltip
                    offset={40}
                    formatter={(value, name, props) => {
                        if (value.toString().indexOf('.') >= 0) {
                            value = numeral(value).format('0.00')
                        }
                        return value
                    }} />
            </PieChart>
        )
    }
}
StatPie.propTypes = {
    store: PropTypes.object,
    pageStore: PropTypes.object,
    match: PropTypes.object,
    width: PropTypes.number,
    height: PropTypes.number,
    mypart: PropTypes.object,
}
StatPie.defaultProps = {
    width: 300,
    height: 300,
}


export default StatPie