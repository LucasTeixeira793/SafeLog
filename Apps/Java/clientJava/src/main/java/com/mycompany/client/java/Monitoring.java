package com.mycompany.client.java;

import com.github.britooo.looca.api.core.Looca;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import oshi.SystemInfo;
import oshi.hardware.NetworkIF;
import oshi.hardware.CentralProcessor;
import oshi.hardware.HardwareAbstractionLayer;

// Essa Classe tem como herança a Classe Looca, o comando "extends" pega os valores atributos
// da classe Looca para serem utilizados de forma simples na classe "Monitoring"
public class Monitoring extends Looca {

    // Dentro deste Método é chamada a Classe "SystemInfo" que retorna as informações do getSystemHardware() 
    public static HardwareAbstractionLayer getSystemHardware() {
        SystemInfo sys = new SystemInfo();
        return sys.getHardware();
    }

    // Criação  de uma lista com a quantidade de placas de redes e retorno desses dados com o getSystemHardware()
    public static String getMacAddress() {
        List<NetworkIF> netIfs = getSystemHardware().getNetworkIFs();
        return netIfs.get(0).getMacaddr();
    }

    // Formatação dos dados de Temperatura
    public Double getTemp() {
        return Math.round(super.getTemperatura().getTemperatura() * 100) / 100d;
    }

    // Formatação dos dados do Clock para porcentagem
    public Double getClockCPU() {
        CentralProcessor cpu = getSystemHardware().getProcessor();
        Long maxFreq = cpu.getMaxFreq();
        Long freq = cpu.getCurrentFreq()[0];
        return Math.round((freq * 10000) / (maxFreq)) / 100d;
    }

    // Formatação dos dados de Uso da CPU para porcentagem
    public Double getUsoCPU() {
        return Math.round(super.getProcessador().getUso() * 100) / 100d;
    }

    // Formatação dos dados de uso da Ram para GB para porcentagem
    public Double getUsoRAMGb() {
        return Math.round(super.getMemoria().getEmUso() * 100 / 1_073_741_824) / 100d;
    }

    // Formatação dos dados de Ram livre para GB e porcentagem
    public Double getFreeRAMGb() {
        return Math.round(
                super.getMemoria().getDisponivel() * 100 / 1_073_741_824) / 100d;
    }

    // Formatação dos dados do total de Ram para GB e porcentagem 
    public Double getTotalRAMGb() {
        return Math.round(super.getMemoria().getTotal() * 100 / 1_073_741_824) / 100d;
    }

    // Formatação dos dados do uso de Disco para GB e porcentagem
    public Double getUsoDiscoGb() {
        // System.out.println("-".repeat(30));
        // System.out.println(super.getGrupoDeDiscos().getDiscos().get(0));
        // System.out.println("-".repeat(30));
        // System.out.println(super.getGrupoDeDiscos().getDiscos().get(1));
        return Math
                .round((super.getGrupoDeDiscos().getDiscos().get(0).
                        getBytesDeEscritas()
                        + super.getGrupoDeDiscos().getDiscos().get(0).
                                getBytesDeLeitura()) * 100 / 1_073_741_824)
                / 100d;
    }

    // Formatação dos dados do total de Disco para GB e porcentagem
    public Double getTotalDiscoGb() {
        return Math.round(super.getGrupoDeDiscos().getDiscos().get(0).
                getTamanho() * 100 / 1_073_741_824) / 100d;
    }

    // Formatação dos dados de Disco livre para GB e porcentagem
    public Double getFreeDiscoGb() {
        return Math.round((getTotalDiscoGb() - getUsoDiscoGb()) * 100) / 100d;
    }

    public Double getFreeDisco() {
        return Math.round((getFreeDiscoGb() * 100 / getTotalDiscoGb()) * 100) / 100d;
    }

    public Double getUsoDisco() {
        return Math.round((getUsoDiscoGb() * 100 / getTotalDiscoGb()) * 100) / 100d;
    }

    public Double getFreeRAM() {
        return Math.round((getFreeRAMGb() * 100 / getTotalRAMGb()) * 100) / 100d;
    }

    public Double getUsoRAM() {
        return Math.round((getUsoRAMGb() * 100 / getTotalRAMGb()) * 100) / 100d;
    }

    public static String getDatetime() {
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern(
                "yyyy-MM-dd HH:mm:ss");
        LocalDateTime now = LocalDateTime.now();
        return dtf.format(now);
    }

    @Override
    public String toString() {
        return String.format(
                "Monitoramento Servidor: %s: " + "\n\tTemperatura: %.2fºC\n\t" + "Uso de CPU: %.2f%% \n\t"
                + "Clock CPU: %.2f%% \n\t" + "Uso de RAM: %.2f%% \n\t" + "RAM Disponível: %.2fGb \n\t"
                + "RAM Total: %.2fGb \n\t" + "Uso de Disco: %.2f%% \n\t" + "Disco Disponível: %.2fGb \n\t"
                + "Disco Total: %.2fGb \n\t",
                getMacAddress(), getTemp(), getUsoCPU(), getClockCPU(),
                getUsoRAM(), getFreeRAMGb(), getTotalRAMGb(),
                getUsoDisco(), getFreeDiscoGb(), getTotalDiscoGb());
    }

}
